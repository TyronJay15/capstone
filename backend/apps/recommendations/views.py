from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.audit.models import AuditTrail
from apps.audit.services import record_audit
from apps.students.services.dashboard import resolve_student_profile
from shared.permissions.roles import Role

from .models import CourseRecommendation
from .permissions import IsRecommendationViewer
from .serializers import CourseRecommendationSerializer
from .services import (
    RecommendationError,
    generate_recommendation,
    get_latest_recommendation,
    get_section_recommendation_summary,
)


def _resolve_target_student(request):
    """Resolve the student the request is acting on, honoring RBAC.

    Student → self. Parent → linked child via ?lrn=. Staff → any via ?lrn=.
    Returns (profile, error_response).
    """
    lrn = request.query_params.get('lrn') or request.data.get('lrn')
    profile = resolve_student_profile(request.user, lrn=lrn)
    if not profile:
        if request.user.role in (Role.PARENT,) and not lrn:
            return None, Response(
                {'detail': 'Child LRN is required.'}, status=status.HTTP_400_BAD_REQUEST
            )
        if request.user.role in Role.STAFF and not lrn:
            return None, Response(
                {'detail': 'Student LRN is required.'}, status=status.HTTP_400_BAD_REQUEST
            )
        return None, Response(
            {'detail': 'Student profile not found or access denied.'},
            status=status.HTTP_404_NOT_FOUND,
        )
    return profile, None


class LatestRecommendationView(APIView):
    """GET /api/v1/recommendations/me/ (or ?lrn= for parent/staff).

    Returns the latest college course recommendation for the resolved student.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile, error = _resolve_target_student(request)
        if error:
            return error
        latest = get_latest_recommendation(profile)
        if not latest:
            return Response({'detail': 'No recommendation generated yet.', 'data': None}, status=status.HTTP_404_NOT_FOUND)
        return Response(CourseRecommendationSerializer(latest).data)


class GenerateRecommendationView(APIView):
    """POST /api/v1/recommendations/generate/ (student self, or staff with lrn).

    Builds and stores a new versioned recommendation, returns the latest.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role == Role.PARENT:
            return Response(
                {'detail': 'Parents cannot generate recommendations.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        profile, error = _resolve_target_student(request)
        if error:
            return error
        try:
            record = generate_recommendation(profile, user=request.user)
        except RecommendationError as exc:
            return Response(
                {'detail': exc.message, 'code': exc.code},
                status=status.HTTP_400_BAD_REQUEST,
            )
        record_audit(
            request.user,
            AuditTrail.Module.RECOMMENDATION,
            f'Generated recommendation (v{record.version}) for {profile.full_name}',
            metadata={'lrn': profile.lrn, 'top_course': record.top_course},
        )
        return Response(
            CourseRecommendationSerializer(record).data, status=status.HTTP_201_CREATED
        )


class RecommendationHistoryView(APIView):
    """GET /api/v1/recommendations/history/ — all versions for a student."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile, error = _resolve_target_student(request)
        if error:
            return error
        records = CourseRecommendation.objects.filter(student=profile).order_by('-version')
        return Response(CourseRecommendationSerializer(records, many=True).data)


class RecommendationSummaryView(APIView):
    """GET /api/v1/recommendations/summary/ — School Year → Section → Student.

    Adviser / Head Teacher / Admin view of the latest recommendations.
    """

    permission_classes = [IsAuthenticated, IsRecommendationViewer]

    def get(self, request):
        from apps.enrollment.models import AcademicYear

        academic_year = None
        label = request.query_params.get('academic_year')
        if label:
            academic_year = AcademicYear.objects.filter(label=label).first()
        summary = get_section_recommendation_summary(academic_year=academic_year)
        return Response({'results': summary})
