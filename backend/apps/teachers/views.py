from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.authentication.permissions import IsTeacher
from apps.enrollment.models import AcademicYear
from apps.enrollment.services import get_current_academic_year
from apps.teachers.models import TeacherAssignment, TeacherLoginLog
from apps.teachers.serializers import TeacherAssignmentSerializer, TeacherLoginLogSerializer
from apps.teachers.services import (
    build_teacher_roster_entry,
    filter_approved_roster,
    get_teacher_student_queryset,
)
from shared.permissions.roles import Role, role_permission_class

IsTeacherOrAdmin = role_permission_class(Role.TEACHER, Role.ADMIN)
class TeacherRosterView(APIView):
    """GET /api/v1/teachers/roster/ — students visible to the logged-in teacher."""

    permission_classes = [IsAuthenticated, IsTeacher]

    def get(self, request):
        label = request.query_params.get('academic_year_label')
        year = None
        if label:
            year = AcademicYear.objects.filter(label=label).first()
        if not year:
            year = get_current_academic_year()

        profiles = get_teacher_student_queryset(request.user, academic_year=year)
        roster = [build_teacher_roster_entry(p) for p in filter_approved_roster(profiles)]
        return Response(roster)


class TeacherAssignmentsView(APIView):
    """GET /api/v1/teachers/assignments/ — subject/section assignments for teacher."""

    permission_classes = [IsAuthenticated, IsTeacher]

    def get(self, request):
        qs = TeacherAssignment.objects.filter(teacher=request.user).select_related(
            'subject', 'academic_year', 'section'
        )
        return Response(TeacherAssignmentSerializer(qs, many=True).data)


class TeacherLoginHistoryView(ListAPIView):
    """
    GET /api/v1/teachers/login-history/
    A teacher sees only their own sign-in history; an admin sees every
    teacher's history and may narrow it with ?user=<id>. The queryset is
    scoped by role, so a teacher cannot reach another teacher's records by
    passing a different id.
    """

    serializer_class = TeacherLoginLogSerializer
    permission_classes = [IsAuthenticated, IsTeacherOrAdmin]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['user']

    def get_queryset(self):
        qs = TeacherLoginLog.objects.select_related('user')
        if self.request.user.role == Role.TEACHER:
            return qs.filter(user=self.request.user)
        return qs
