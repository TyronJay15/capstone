from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.filters import OrderingFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.authentication.permissions import IsTeacher
from apps.students.models import StudentProfile
from apps.students.services.dashboard import build_dashboard_payload, semester_to_short
from shared.permissions.roles import Role, role_permission_class

from .filters import GradeRecordFilter
from .models import GradeRecord, Semester, Subject
from .serializers import (
    BulkGradeSerializer,
    GradeRecordSerializer,
    GradeRecordWriteSerializer,
    SemesterSerializer,
    SubjectSerializer,
)
from .services.grades import (
    GradeServiceError,
    bulk_upsert_grades,
    get_teacher_grade_queryset,
    student_has_parent_consent,
    teacher_can_manage_grade,
)

IsAcademicStaff = role_permission_class(Role.TEACHER, Role.REGISTRAR, Role.ADMIN)
IsTeacherOnly = role_permission_class(Role.TEACHER)


class SubjectViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Subject.objects.filter(is_active=True)
    serializer_class = SubjectSerializer
    permission_classes = [IsAuthenticated, IsAcademicStaff]
    pagination_class = None


class SemesterViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = SemesterSerializer
    permission_classes = [IsAuthenticated, IsAcademicStaff]
    pagination_class = None
    filterset_fields = ['academic_year']

    def get_queryset(self):
        return Semester.objects.select_related('academic_year')


class GradeRecordViewSet(viewsets.ModelViewSet):
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = GradeRecordFilter
    ordering_fields = ['subject__name', 'student__last_name', 'updated_at']
    ordering = ['student__last_name', 'subject__name']

    def get_permissions(self):
        if self.action in ('list', 'retrieve', 'by_student'):
            return [IsAuthenticated(), IsAcademicStaff()]
        if self.action == 'bulk':
            return [IsAuthenticated(), IsTeacher()]
        return [IsAuthenticated(), IsAcademicStaff()]

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return GradeRecordWriteSerializer
        return GradeRecordSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role in (Role.ADMIN, Role.REGISTRAR) or user.is_superuser:
            return GradeRecord.objects.select_related(
                'student',
                'student__section',
                'student__academic_year',
                'subject',
                'semester',
                'semester__academic_year',
            )
        if user.role == Role.TEACHER:
            return get_teacher_grade_queryset(user)
        return GradeRecord.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        student = serializer.validated_data['student']
        subject = serializer.validated_data['subject']
        if not teacher_can_manage_grade(user=user, student=student, subject=subject):
            raise PermissionDenied(
                'You are not assigned to encode grades for this student and subject.'
            )
        serializer.save(encoded_by=user)

    def perform_update(self, serializer):
        user = self.request.user
        student = serializer.validated_data.get('student', serializer.instance.student)
        subject = serializer.validated_data.get('subject', serializer.instance.subject)
        if not teacher_can_manage_grade(user=user, student=student, subject=subject):
            raise PermissionDenied('You are not assigned to update this grade record.')
        serializer.save(encoded_by=user)

    @action(detail=False, methods=['post'], url_path='bulk')
    def bulk(self, request):
        serializer = BulkGradeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        result = bulk_upsert_grades(
            user=request.user,
            semester=data['semester'],
            entries=data['entries'],
        )
        status_code = status.HTTP_200_OK if not result['errors'] else status.HTTP_207_MULTI_STATUS
        return Response({'success': not result['errors'], **result}, status=status_code)

    @action(detail=False, methods=['get'], url_path='by-student')
    def by_student(self, request):
        lrn = request.query_params.get('lrn', '').strip()
        if not lrn:
            return Response({'detail': 'lrn query parameter is required.'}, status=400)

        student = (
            StudentProfile.objects.select_related('section', 'academic_year')
            .filter(lrn=lrn, is_active=True)
            .first()
        )
        if not student:
            return Response({'detail': 'Student not found.'}, status=404)

        if request.user.role == Role.TEACHER and not student_has_parent_consent(student):
            return Response(
                {
                    'blocked': True,
                    'reason': (
                        'Parent consent is required before teachers can view student grades.'
                    ),
                },
                status=403,
            )

        if request.user.role == Role.TEACHER:
            visible_subjects = set()
            from apps.teachers.models import TeacherAssignment

            for assignment in TeacherAssignment.objects.filter(teacher=request.user):
                if assignment.academic_year_id != student.academic_year_id:
                    continue
                if assignment.grade_level and assignment.grade_level != student.grade_level:
                    continue
                if assignment.section_id and assignment.section_id != student.section_id:
                    continue
                visible_subjects.add(assignment.subject_id)

            grades_qs = GradeRecord.objects.filter(
                student=student, subject_id__in=visible_subjects
            ).select_related('subject', 'semester')
        else:
            grades_qs = GradeRecord.objects.filter(student=student).select_related(
                'subject', 'semester'
            )

        payload = build_dashboard_payload(student)
        payload['grades'] = [
            {
                'subject': g.subject.name,
                'grade': float(g.score),
                'semester': semester_to_short(g.semester.label),
            }
            for g in grades_qs
        ]
        if not payload['grades'] and request.user.role == Role.TEACHER:
            return Response(
                {
                    'blocked': True,
                    'reason': 'No grade records found for this student in your assigned subjects.',
                },
                status=404,
            )

        return Response({'blocked': False, 'student': payload})
