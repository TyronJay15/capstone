from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from shared.permissions.roles import Role

from .models import LoginActivity
from .services import record_login

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
        request = self.context.get('request')
        record_login(self.user, request)
        if self.user.role == Role.TEACHER:
            from apps.teachers.services import record_teacher_login

            record_teacher_login(self.user, request)
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

        record_login(user, request, student_lrn=lrn)

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

        from apps.parents.services import record_parent_login

        request = self.context.get('request')
        record_login(user, request, student_lrn=child_lrn)
        record_parent_login(user, request)

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


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField()


class ChangePasswordSerializer(serializers.Serializer):
    """Change the signed-in user's own password.

    The current password must be supplied and verified, so a stolen access
    token alone cannot be used to take over an account.
    """

    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)

    def validate_current_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Incorrect current password.')
        return value

    def validate_new_password(self, value):
        validate_password(value, user=self.context['request'].user)
        return value

    def validate(self, attrs):
        if attrs['current_password'] == attrs['new_password']:
            raise serializers.ValidationError(
                {'new_password': 'New password must be different from the current password.'}
            )
        return attrs

    def save(self, **kwargs):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save(update_fields=['password'])
        return user


class LoginActivitySerializer(serializers.ModelSerializer):
    display_name = serializers.SerializerMethodField()

    class Meta:
        model = LoginActivity
        fields = (
            'id',
            'user',
            'role',
            'email',
            'full_name',
            'display_name',
            'student_lrn',
            'ip_address',
            'logged_in_at',
        )
        read_only_fields = fields

    def get_display_name(self, obj):
        return obj.full_name or obj.email or obj.student_lrn or 'Unknown user'


class RegisterStaffSerializer(serializers.ModelSerializer):
    """Admin-only: create a managed non-student account."""

    password = serializers.CharField(write_only=True, min_length=6)
    role = serializers.ChoiceField(
        choices=['admin', 'registrar', 'teacher', 'adviser', 'head_teacher', 'parent']
    )

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
