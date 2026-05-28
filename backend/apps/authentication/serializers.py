from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            'id',
            'email',
            'first_name',
            'last_name',
            'role',
            'student_lrn',
        )
        read_only_fields = fields


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

        refresh = self.get_token(user)
        data = {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data,
        }
        return data


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
