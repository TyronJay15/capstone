from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from shared.permissions.roles import Role, role_permission_class

from .models import StudentProfile
from .serializers import StudentProfileSerializer, StudentProfileUpdateSerializer
from .services.dashboard import build_dashboard_payload, resolve_student_profile
from .services.profile import update_student_profile

IsStudentOrStaff = role_permission_class(
    Role.STUDENT, Role.PARENT, Role.TEACHER, Role.REGISTRAR, Role.ADMIN
)


class StudentProfileViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = StudentProfileSerializer
    permission_classes = [IsAuthenticated, IsStudentOrStaff]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['academic_year', 'section', 'grade_level', 'is_active', 'lrn']
    search_fields = ['lrn', 'first_name', 'last_name', 'email']
    ordering_fields = ['last_name', 'lrn']
    ordering = ['last_name']

    def get_queryset(self):
        return StudentProfile.objects.select_related(
            'academic_year', 'section', 'enrollment'
        )

    @action(detail=False, methods=['get', 'patch'], url_path='me')
    def me(self, request):
        """
        GET /api/v1/students/me/ — Fetch current student's profile
        PATCH /api/v1/students/me/ — Update current student's profile
        """
        profile = resolve_student_profile(request.user)
        if not profile:
            return Response({'detail': 'Student profile not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        if request.method == 'GET':
            serializer = StudentProfileSerializer(profile)
            return Response(serializer.data)
        
        if request.method == 'PATCH':
            # Only student can update their own profile
            if request.user.role != Role.STUDENT:
                return Response(
                    {'detail': 'Only students can update their own profile.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            serializer = StudentProfileUpdateSerializer(
                profile,
                data=request.data,
                partial=True
            )
            if serializer.is_valid():
                try:
                    updated_profile = update_student_profile(
                        request.user,
                        serializer.validated_data
                    )
                    return Response(
                        StudentProfileSerializer(updated_profile).data,
                        status=status.HTTP_200_OK
                    )
                except StudentProfile.DoesNotExist:
                    return Response(
                        {'detail': 'Student profile not found.'},
                        status=status.HTTP_404_NOT_FOUND
                    )
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StudentDashboardView(APIView):
    """
    GET /api/v1/students/dashboard/
    Students: own dashboard. Parents: ?lrn=child. Staff: ?lrn=optional.
    """

    permission_classes = [IsAuthenticated, IsStudentOrStaff]

    def get(self, request):
        lrn = request.query_params.get('lrn')
        if request.user.role == Role.PARENT and not lrn:
            return Response(
                {'detail': 'Child LRN is required for parent dashboard access.'},
                status=400,
            )

        profile = resolve_student_profile(request.user, lrn=lrn)
        if not profile:
            return Response(
                {'detail': 'Student profile not found or access denied.'},
                status=404,
            )

        return Response(build_dashboard_payload(profile))
