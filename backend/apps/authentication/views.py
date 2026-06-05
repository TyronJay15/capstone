from django.conf import settings
from rest_framework import status
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.permissions import IsAuthenticated
from shared.permissions.roles import Role
from .serializers import (
    EmailTokenObtainPairSerializer,
    ParentTokenObtainPairSerializer,
    RecaptchaVerifySerializer,
    RegisterStaffSerializer,
    StudentTokenObtainPairSerializer,
    UserManagementSerializer,
    UserSerializer,
)
from .services import verify_recaptcha_token
from .models import User


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


class UserManagementViewSet(viewsets.ModelViewSet):
    """
    Admin-only account directory backed by the custom auth user table.
    Supports list/search/filter, retrieve, activate/deactivate, and delete.
    """

    serializer_class = UserManagementSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['role', 'is_active']
    search_fields = ['email', 'first_name', 'last_name', 'student_lrn']
    ordering_fields = ['email', 'first_name', 'last_name', 'role', 'date_joined', 'last_login']
    ordering = ['role', 'last_name', 'first_name', 'email']
    http_method_names = ['get', 'patch', 'delete', 'head', 'options']

    def get_queryset(self):
        return User.objects.all()

    def get_permissions(self):
        permissions = super().get_permissions()
        return permissions

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        if request.user.role != Role.ADMIN and not request.user.is_superuser:
            self.permission_denied(
                request,
                message='Only admins can manage user accounts.',
            )


class RegisterStaffView(APIView):
    """
    POST /api/v1/auth/register/
    Admin-only: create a new staff account (admin / registrar / teacher).
    The new user shows up immediately in Django Admin.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role not in ('admin',) and not request.user.is_superuser:
            return Response(
                {'detail': 'Only admins can create staff accounts.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = RegisterStaffSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
