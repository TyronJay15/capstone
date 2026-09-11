from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .permissions import IsHeadTeacherOrAdmin
from .services import (
    HeadTeacherError,
    assign_adviser,
    assign_subject_teacher,
    build_section_summary,
    create_section,
    get_teacher_directory,
)


class TeacherDirectoryView(APIView):
    """GET /api/v1/headteachers/teachers/ — alphabetical staff directory."""

    permission_classes = [IsAuthenticated, IsHeadTeacherOrAdmin]

    def get(self, request):
        return Response({'results': get_teacher_directory()})


class AssignAdviserView(APIView):
    """POST /api/v1/headteachers/assign-adviser/ {adviser_id, section_id}."""

    permission_classes = [IsAuthenticated, IsHeadTeacherOrAdmin]

    def post(self, request):
        try:
            assignment = assign_adviser(
                adviser_id=request.data.get('adviser_id'),
                section_id=request.data.get('section_id'),
                by_user=request.user,
            )
        except HeadTeacherError as exc:
            return Response({'detail': exc.message, 'code': exc.code}, status=status.HTTP_400_BAD_REQUEST)
        return Response(
            {
                'section': assignment.section.name,
                'adviser': assignment.adviser.get_full_name() or assignment.adviser.email,
            },
            status=status.HTTP_201_CREATED,
        )


class AssignSubjectTeacherView(APIView):
    """POST /api/v1/headteachers/assign-subject-teacher/ {teacher_id, subject_id, section_id?}."""

    permission_classes = [IsAuthenticated, IsHeadTeacherOrAdmin]

    def post(self, request):
        try:
            assignment = assign_subject_teacher(
                teacher_id=request.data.get('teacher_id'),
                subject_id=request.data.get('subject_id'),
                section_id=request.data.get('section_id'),
                grade_level=request.data.get('grade_level', ''),
                by_user=request.user,
            )
        except HeadTeacherError as exc:
            return Response({'detail': exc.message, 'code': exc.code}, status=status.HTTP_400_BAD_REQUEST)
        return Response(
            {
                'teacher': assignment.teacher.get_full_name() or assignment.teacher.email,
                'subject': assignment.subject.name,
                'section': assignment.section.name if assignment.section else None,
            },
            status=status.HTTP_201_CREATED,
        )


class SectionCreateView(APIView):
    """POST /api/v1/headteachers/sections/ {name, grade_level?, strand_code?}."""

    permission_classes = [IsAuthenticated, IsHeadTeacherOrAdmin]

    def post(self, request):
        try:
            section = create_section(
                name=request.data.get('name'),
                grade_level=request.data.get('grade_level', ''),
                strand_code=request.data.get('strand_code', ''),
                by_user=request.user,
            )
        except HeadTeacherError as exc:
            return Response({'detail': exc.message, 'code': exc.code}, status=status.HTTP_400_BAD_REQUEST)
        return Response(
            {'id': section.id, 'name': section.name, 'school_year': section.academic_year.label},
            status=status.HTTP_201_CREATED,
        )


class SectionSummaryView(APIView):
    """GET /api/v1/headteachers/sections/summary/ — full section summary."""

    permission_classes = [IsAuthenticated, IsHeadTeacherOrAdmin]

    def get(self, request):
        return Response({'results': build_section_summary()})
