from django.contrib.auth import get_user_model
from rest_framework import serializers, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id',
            'email',
            'first_name',
            'last_name',
            'full_name',
            'role',
            'student_lrn',
            'is_active',
            'status',
            'last_login',
            'date_joined',
        )
        read_only_fields = fields

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.email

    def get_status(self, obj):
        return 'active' if obj.is_active else 'inactive'


class UserManagementSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id',
            'email',
            'first_name',
            'last_name',
            'full_name',
            'role',
            'student_lrn',
            'is_active',
            'status',
            'last_login',
            'date_joined',
        )
        read_only_fields = (
            'id',
            'email',
            'first_name',
            'last_name',
            'full_name',
            'role',
            'student_lrn',
            'status',
            'last_login',
            'date_joined',
        )

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.email

    def get_status(self, obj):
        return 'active' if obj.is_active else 'inactive'


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = User.USERNAME_FIELD

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['email'] = user.email
        token['student_lrn'] = user.student_lrn or ''
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = UserSerializer(self.user).data
        return data


class StudentTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Login with LRN + password for approved student accounts."""

    lrn = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields.pop('email', None)

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['student_lrn'] = user.student_lrn or ''
        return token

    def validate(self, attrs):
        from apps.students.models import StudentProfile, StudentLoginLog

        lrn = attrs.get('lrn', '').strip()
        password = attrs.get('password', '')

        try:
            user = User.objects.get(role='student', student_lrn=lrn, is_active=True)
        except User.DoesNotExist:
            raise serializers.ValidationError(
                {'detail': 'Invalid LRN or student account is not yet approved for portal access.'}
            ) from None

        if not user.check_password(password):
            raise serializers.ValidationError({'detail': 'Invalid password.'})

        # Get IP address from request
        request = self.context.get('request')
        ip_address = None
        user_agent = ''
        if request:
            ip_address = self._get_client_ip(request)
            user_agent = request.META.get('HTTP_USER_AGENT', '')

        # Get StudentProfile and record login
        try:
            student_profile = StudentProfile.objects.get(lrn=lrn)
            StudentLoginLog.objects.create(
                student=student_profile,
                user=user,
                ip_address=ip_address,
                user_agent=user_agent,
            )
        except StudentProfile.DoesNotExist:
            pass  # Student profile may not exist yet, but user can still login

        refresh = self.get_token(user)
        data = {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data,
        }
        return data

    @staticmethod
    def _get_client_ip(request):
        """Get client IP address from request."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class ParentTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Parent login with email, password, and child LRN."""

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    child_lrn = serializers.CharField()

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields.pop(self.username_field, None)

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['email'] = user.email
        return token

    def validate(self, attrs):
        from apps.students.models import ParentStudentLink, StudentProfile

        email = attrs.get('email', '').strip().lower()
        password = attrs.get('password', '')
        child_lrn = attrs.get('child_lrn', '').strip()

        try:
            user = User.objects.get(email=email, role='parent', is_active=True)
        except User.DoesNotExist:
            raise serializers.ValidationError(
                {'detail': 'Parent account not found.'}
            ) from None

        if not user.check_password(password):
            raise serializers.ValidationError({'detail': 'Invalid password.'})

        student = StudentProfile.objects.filter(lrn=child_lrn, is_active=True).first()
        if not student:
            raise serializers.ValidationError(
                {'detail': 'Child LRN not found or not yet approved for portal access.'}
            )

        if not ParentStudentLink.objects.filter(parent=user, student=student).exists():
            raise serializers.ValidationError(
                {'detail': 'You are not linked to this student account.'}
            )

        refresh = self.get_token(user)
        data = {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data,
            'child_lrn': child_lrn,
        }
        return data


class RecaptchaVerifySerializer(serializers.Serializer):
    token = serializers.CharField(required=False, allow_blank=True)
# ─────────────────────────────────────────────────────────────────────────────
# ADD THIS TO: backend/apps/authentication/serializers.py
# ─────────────────────────────────────────────────────────────────────────────

class RegisterStaffSerializer(serializers.ModelSerializer):
    """Admin-only: create a managed non-student account."""

    password = serializers.CharField(write_only=True, min_length=6)
    role = serializers.ChoiceField(choices=['admin', 'registrar', 'teacher', 'parent'])

    class Meta:
        model = User
        fields = ('email', 'first_name', 'last_name', 'role', 'password')

    def validate_email(self, value):
        value = value.strip().lower()
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('An account with this email already exists.')
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.username = validated_data['email']
        user.set_password(password)
        user.is_staff = validated_data.get('role') in ('admin', 'registrar')
        user.save()
        return user


# ─────────────────────────────────────────────────────────────────────────────
# ADD THIS VIEW TO: backend/apps/authentication/views.py
# ─────────────────────────────────────────────────────────────────────────────

# Add this import at the top of views.py:
#   from .serializers import RegisterStaffSerializer, UserSerializer
# Add this import:
#   from rest_framework.permissions import IsAuthenticated
# Add this import from your permissions file:
#   from shared.permissions.roles import Role, role_permission_class

# IsAdminOnly = role_permission_class(Role.ADMIN)

class RegisterStaffView(APIView):
    """
    POST /api/v1/auth/register/
    Admin-only: create a new staff account (admin / registrar / teacher).
    The new user shows up immediately in Django Admin.
    """
    # Change to [IsAuthenticated, IsAdminOnly] once you wire permissions in:
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Only admins may call this
        if request.user.role not in ('admin',) and not request.user.is_superuser:
            return Response(
                {'detail': 'Only admins can create staff accounts.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = RegisterStaffSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


# ─────────────────────────────────────────────────────────────────────────────
# ADD THIS URL TO: backend/apps/authentication/urls.py
# ─────────────────────────────────────────────────────────────────────────────

# In the urlpatterns list, add:
#   path('register/', RegisterStaffView.as_view(), name='auth-register'),
