from datetime import timedelta

from django.conf import settings
from django.db.models import Count
from django.utils import timezone
from rest_framework import status
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.generics import ListAPIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework.permissions import IsAuthenticated
from shared.permissions.roles import Role, role_permission_class
from .serializers import (
    ChangePasswordSerializer,
    EmailTokenObtainPairSerializer,
    LoginActivitySerializer,
    LogoutSerializer,
    ParentTokenObtainPairSerializer,
    RecaptchaVerifySerializer,
    RegisterStaffSerializer,
    StudentTokenObtainPairSerializer,
    UserManagementSerializer,
    UserSerializer,
)
from .services import verify_recaptcha_token
from .models import LoginActivity, User

IsAdminOnly = role_permission_class(Role.ADMIN)
IsAdminOrRegistrar = role_permission_class(Role.ADMIN, Role.REGISTRAR)


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


class LogoutView(APIView):
    """
    POST /api/v1/auth/logout/
    Blacklists the given refresh token so it can no longer be used to obtain
    new access tokens, even if the client-side copy is not cleared.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            token = RefreshToken(serializer.validated_data['refresh'])
            token.blacklist()
        except TokenError:
            # Already invalid/expired/blacklisted — logout still succeeds.
            pass

        # Close the matching login-log session so its duration is recorded.
        if request.user.role == Role.PARENT:
            from apps.parents.services import close_parent_login_session

            close_parent_login_session(request.user)
        elif request.user.role == Role.TEACHER:
            from apps.teachers.services import close_teacher_login_session

            close_teacher_login_session(request.user)

        return Response(status=status.HTTP_205_RESET_CONTENT)


class UserManagementViewSet(viewsets.ModelViewSet):
    """
    Admin-only account directory backed by the custom auth user table.
    Supports list/search/filter, retrieve, activate/deactivate, and delete.
    """

    serializer_class = UserManagementSerializer
    permission_classes = [IsAuthenticated, IsAdminOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['role', 'is_active']
    search_fields = ['email', 'first_name', 'last_name', 'student_lrn']
    ordering_fields = ['email', 'first_name', 'last_name', 'role', 'date_joined', 'last_login']
    ordering = ['role', 'last_name', 'first_name', 'email']
    http_method_names = ['get', 'patch', 'delete', 'head', 'options']

    def get_queryset(self):
        return User.objects.all()

    def perform_update(self, serializer):
        # `role` is read-only on the serializer, so an account's role can never
        # be escalated through this endpoint — only `is_active` is writable.
        if serializer.instance == self.request.user:
            raise PermissionDenied('You cannot change the status of your own account.')
        serializer.save()

    def perform_destroy(self, instance):
        if instance == self.request.user:
            raise PermissionDenied('You cannot delete your own account.')
        instance.delete()


class ChangePasswordView(APIView):
    """
    POST /api/v1/auth/change-password/
    Any signed-in user changes their own password. The current password is
    re-verified and the new one is run through Django's password validators.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'detail': 'Password changed successfully.'}, status=status.HTTP_200_OK)


class UserStatisticsView(APIView):
    """
    GET /api/v1/auth/statistics/
    Account statistics aggregated straight from the database. Available to
    admins and registrars (the roles that already administer accounts and
    enrollment); every other role is rejected.
    """

    permission_classes = [IsAuthenticated, IsAdminOrRegistrar]

    def get(self, request):
        counts_by_role = {
            row['role']: row['total']
            for row in User.objects.values('role').annotate(total=Count('id'))
        }
        active_by_role = {
            row['role']: row['total']
            for row in User.objects.filter(is_active=True)
            .values('role')
            .annotate(total=Count('id'))
        }

        by_role = {role: counts_by_role.get(role, 0) for role in Role.ALL}
        active_roles = {role: active_by_role.get(role, 0) for role in Role.ALL}

        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()

        since = timezone.now() - timedelta(days=7)

        return Response(
            {
                'totals': {
                    'users': total_users,
                    'active': active_users,
                    'inactive': total_users - active_users,
                },
                'by_role': by_role,
                'active_by_role': active_roles,
                'logins_last_7_days': LoginActivity.objects.filter(
                    logged_in_at__gte=since
                ).count(),
                'generated_at': timezone.now(),
            }
        )


class LoginActivityListView(ListAPIView):
    """
    GET /api/v1/auth/login-activity/
    Recent successful logins across student / parent / teacher / staff
    accounts. Admin-only: this is sensitive account-activity data.

    Supports ?role=<role>, ?search=<name|email|lrn> and pagination.
    """

    serializer_class = LoginActivitySerializer
    permission_classes = [IsAuthenticated, IsAdminOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['role']
    search_fields = ['full_name', 'email', 'student_lrn']

    def get_queryset(self):
        return LoginActivity.objects.select_related('user').all()


class RegisterStaffView(APIView):
    """
    POST /api/v1/auth/register/
    Admin-only: create a new staff account (admin / registrar / teacher).
    The new user shows up immediately in Django Admin.
    """
    permission_classes = [IsAuthenticated, IsAdminOnly]

    def post(self, request):
        serializer = RegisterStaffSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
