from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.authentication.permissions import IsAdmin, IsRegistrar
from shared.permissions.roles import Role

from .filters import EnrollmentFilter
from .models import AcademicYear, Enrollment, Section
from .permissions import IsRegistrarOrAdmin, IsStaffEnrollment
from .serializers import (
    AcademicYearSerializer,
    AdminIncomingSerializer,
    AdminRosterSerializer,
    BulkSectionAssignmentSerializer,
    EnrollmentCreateSerializer,
    EnrollmentSerializer,
    EnrollmentStatusSerializer,
    ParentConsentSerializer,
    RegistrarRequestSerializer,
    SectionAssignmentSerializer,
    SectionSerializer,
)
from . import services


class AcademicYearViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    queryset = AcademicYear.objects.all()
    serializer_class = AcademicYearSerializer
    permission_classes = [AllowAny]
    pagination_class = None


class SectionViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = SectionSerializer
    permission_classes = [AllowAny]
    pagination_class = None
    filterset_fields = ['academic_year']

    def get_queryset(self):
        return Section.objects.select_related('academic_year').order_by('name')


class CurrentAcademicYearView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        year = services.get_current_academic_year()
        if not year:
            return Response({'detail': 'No academic year configured.'}, status=404)
        return Response(AcademicYearSerializer(year).data)

    def put(self, request):
        label = request.data.get('label')
        if not label:
            return Response({'detail': 'label is required.'}, status=400)
        if request.user.is_authenticated and request.user.role not in (
            Role.REGISTRAR,
            Role.ADMIN,
        ):
            return Response({'detail': 'Permission denied.'}, status=403)
        year = services.set_current_academic_year(label)
        return Response(AcademicYearSerializer(year).data)


class EnrollmentViewSet(viewsets.ModelViewSet):
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = EnrollmentFilter
    search_fields = ['lrn', 'first_name', 'last_name', 'middle_name']
    ordering_fields = ['submitted_at', 'last_name', 'lrn']
    ordering = ['-submitted_at']

    def get_queryset(self):
        return (
            Enrollment.objects.select_related(
                'academic_year', 'section', 'strand'
            )
            .all()
        )

    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]
        if self.action == 'section_assignments':
            return [AllowAny()]
        if self.action in (
            'update_registrar_status',
            'assign_section',
            'bulk_section_assignments',
        ):
            return [IsAuthenticated, IsRegistrar]
        if self.action in ('update_admin_status', 'set_parent_consent'):
            return [IsAuthenticated, IsAdmin]
        if self.action in (
            'list',
            'retrieve',
            'counts',
            'registrar_requests',
            'admin_incoming',
            'admin_roster',
        ):
            return [IsAuthenticated, IsStaffEnrollment]
        return [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return EnrollmentCreateSerializer
        return EnrollmentSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            enrollment = services.create_enrollment(validated_data=serializer.validated_data)
        except services.EnrollmentServiceError as exc:
            return Response(
                {'success': False, 'error': exc.message, 'code': exc.code},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(
            EnrollmentSerializer(enrollment).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=['post'], url_path='registrar-status')
    def update_registrar_status(self, request, pk=None):
        enrollment = self.get_object()
        serializer = EnrollmentStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            enrollment = services.update_registrar_status(
                enrollment,
                serializer.validated_data['status'],
                reviewer=request.user,
            )
        except services.EnrollmentServiceError as exc:
            return Response({'error': exc.message}, status=400)
        return Response(EnrollmentSerializer(enrollment).data)

    @action(detail=True, methods=['post'], url_path='admin-status')
    def update_admin_status(self, request, pk=None):
        enrollment = self.get_object()
        serializer = EnrollmentStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            enrollment = services.update_admin_status(
                enrollment,
                serializer.validated_data['status'],
                reviewer=request.user,
            )
        except services.EnrollmentServiceError as exc:
            return Response({'error': exc.message}, status=400)
        return Response(EnrollmentSerializer(enrollment).data)

    @action(detail=True, methods=['post'], url_path='assign-section')
    def assign_section(self, request, pk=None):
        enrollment = self.get_object()
        section_name = request.data.get('section')
        if not section_name:
            return Response({'error': 'section is required.'}, status=400)
        section, _ = Section.objects.get_or_create(
            academic_year=enrollment.academic_year,
            name=section_name,
            defaults={'grade_level': enrollment.grade_level_enrollment},
        )
        try:
            enrollment = services.assign_section(enrollment, section)
        except services.EnrollmentServiceError as exc:
            return Response({'error': exc.message}, status=400)
        return Response(EnrollmentSerializer(enrollment).data)

    @action(detail=False, methods=['post'], url_path='bulk-section-assignments')
    def bulk_section_assignments(self, request):
        serializer = BulkSectionAssignmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        academic_year = data.get('academic_year')
        if not academic_year and data.get('academic_year_label'):
            academic_year, _ = AcademicYear.objects.get_or_create(
                label=data['academic_year_label']
            )
        if not academic_year:
            academic_year = services.get_current_academic_year()
        updated = services.bulk_assign_sections(
            data['assignments'], academic_year=academic_year
        )
        return Response({'success': True, 'updated': updated})

    @action(detail=False, methods=['get'])
    def counts(self, request):
        year = self._resolve_academic_year(request)
        if not year:
            return Response({'detail': 'Academic year not found.'}, status=404)
        return Response(services.get_enrollment_counts(academic_year=year))

    @action(detail=False, methods=['get'], url_path='registrar-requests')
    def registrar_requests(self, request):
        year = self._resolve_academic_year(request)
        qs = self.filter_queryset(
            self.get_queryset().filter(academic_year=year) if year else self.get_queryset()
        )
        page = self.paginate_queryset(qs)
        serializer = RegistrarRequestSerializer(page or qs, many=True)
        if page is not None:
            return self.get_paginated_response(serializer.data)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='admin-incoming')
    def admin_incoming(self, request):
        year = self._resolve_academic_year(request)
        qs = self.get_queryset().filter(registrar_status=Enrollment.Status.APPROVED)
        if year:
            qs = qs.filter(academic_year=year)
        qs = self.filter_queryset(qs)
        page = self.paginate_queryset(qs)
        serializer = AdminIncomingSerializer(page or qs, many=True)
        if page is not None:
            return self.get_paginated_response(serializer.data)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='admin-roster')
    def admin_roster(self, request):
        year = self._resolve_academic_year(request)
        qs = self.get_queryset()
        if year:
            qs = qs.filter(academic_year=year)
        qs = self.filter_queryset(qs)
        page = self.paginate_queryset(qs)
        serializer = AdminRosterSerializer(page or qs, many=True)
        if page is not None:
            return self.get_paginated_response(serializer.data)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='section-assignments')
    def section_assignments(self, request):
        year = self._resolve_academic_year(request)
        qs = self.get_queryset().filter(registrar_status=Enrollment.Status.APPROVED)
        if year:
            qs = qs.filter(academic_year=year)
        serializer = SectionAssignmentSerializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='parent-consent')
    def set_parent_consent(self, request):
        serializer = ParentConsentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        enrollment = services.set_parent_consent(
            lrn=data['lrn'],
            granted=data['granted'],
            parent_name=data.get('parent_name', ''),
        )
        if not enrollment:
            return Response({'detail': 'Enrollment not found.'}, status=404)
        return Response(EnrollmentSerializer(enrollment).data)

    def _resolve_academic_year(self, request):
        label = request.query_params.get('academic_year_label')
        year_id = request.query_params.get('academic_year')
        if year_id:
            return AcademicYear.objects.filter(pk=year_id).first()
        if label:
            return AcademicYear.objects.filter(label=label).first()
        return services.get_current_academic_year()
