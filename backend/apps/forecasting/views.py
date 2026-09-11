from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.audit.models import AuditTrail
from apps.audit.services import record_audit
from shared.permissions.roles import Role, role_permission_class

from .services import build_enrollment_forecast

IsForecastViewer = role_permission_class(Role.HEAD_TEACHER, Role.ADMIN, Role.REGISTRAR)


class EnrollmentForecastView(APIView):
    """GET /api/v1/forecasting/enrollment/

    Returns an enrollment projection computed from real data when available,
    otherwise structured demo data flagged with ``demo_mode=true``.
    """

    permission_classes = [IsAuthenticated, IsForecastViewer]

    def get(self, request):
        forecast = build_enrollment_forecast()
        record_audit(
            request.user,
            AuditTrail.Module.FORECAST,
            f'Generated enrollment forecast for {forecast["projected_year"]}',
            metadata={'demo_mode': forecast['demo_mode'], 'projected_total': forecast['projected_total']},
        )
        return Response(forecast)
