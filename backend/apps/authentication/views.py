from django.conf import settings
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .serializers import (
    EmailTokenObtainPairSerializer,
    ParentTokenObtainPairSerializer,
    RecaptchaVerifySerializer,
    StudentTokenObtainPairSerializer,
)
from .services import verify_recaptcha_token


class HealthCheckView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(
            {
                'ok': True,
                'service': 'gradeportal-api',
                'recaptchaConfigured': bool(settings.RECAPTCHA_SECRET_KEY),
            }
        )


class RecaptchaVerifyView(APIView):
    """POST /api/v1/auth/verify-recaptcha/ — compatible with legacy Express response."""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RecaptchaVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token = serializer.validated_data.get('token', '')
        result = verify_recaptcha_token(token)

        if not result['success']:
            status_code = (
                status.HTTP_503_SERVICE_UNAVAILABLE
                if 'not configured' in (result.get('error') or '')
                else status.HTTP_400_BAD_REQUEST
            )
            payload = {'success': False, 'error': result['error']}
            if result.get('codes'):
                payload['codes'] = result['codes']
            return Response(payload, status=status_code)

        return Response({'success': True})


class LoginView(TokenObtainPairView):
    serializer_class = EmailTokenObtainPairSerializer


class StudentLoginView(TokenObtainPairView):
    serializer_class = StudentTokenObtainPairSerializer


class ParentLoginView(TokenObtainPairView):
    serializer_class = ParentTokenObtainPairSerializer


class RefreshView(TokenRefreshView):
    pass
