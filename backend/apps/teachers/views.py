from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.authentication.permissions import IsTeacher
from apps.enrollment.models import AcademicYear
from apps.enrollment.services import get_current_academic_year
from apps.teachers.models import TeacherAssignment
from apps.teachers.serializers import TeacherAssignmentSerializer
from apps.teachers.services import (
    build_teacher_roster_entry,
    filter_approved_roster,
    get_teacher_student_queryset,
)
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
