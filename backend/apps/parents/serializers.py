from rest_framework import serializers

from apps.students.models import StudentProfile

from .models import ParentLoginLog, ParentProfile


class ParentProfileSerializer(serializers.ModelSerializer):
    """Full parent profile — identity fields mirror the User record and are
    always read-only here; only ParentProfile's own contact fields are
    editable (see ParentProfileUpdateSerializer)."""

    email = serializers.EmailField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = ParentProfile
        fields = (
            'id',
            'email',
            'first_name',
            'last_name',
            'full_name',
            'phone_number',
            'address',
            'profession',
            'emergency_contact',
            'emergency_phone',
            'is_active',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'email', 'first_name', 'last_name', 'full_name', 'is_active', 'created_at', 'updated_at')

    def get_full_name(self, obj):
        return obj.user.get_full_name() or obj.user.email


class ParentProfileUpdateSerializer(serializers.ModelSerializer):
    """PATCH /api/v1/parents/me/ — only contact-type fields are writable."""

    class Meta:
        model = ParentProfile
        fields = ('phone_number', 'address', 'profession', 'emergency_contact', 'emergency_phone')

    def validate_phone_number(self, value):
        if not value:
            return value
        digits_only = ''.join(c for c in value if c.isdigit())
        if len(digits_only) < 7:
            raise serializers.ValidationError('Phone number must be at least 7 digits.')
        return value

    def validate_emergency_phone(self, value):
        if not value:
            return value
        digits_only = ''.join(c for c in value if c.isdigit())
        if len(digits_only) < 7:
            raise serializers.ValidationError('Emergency phone number must be at least 7 digits.')
        return value


class ParentLoginLogSerializer(serializers.ModelSerializer):
    """Read-only parent login history. Never exposes credentials."""

    parent_name = serializers.SerializerMethodField()
    email = serializers.EmailField(source='user.email', read_only=True)
    session_duration = serializers.FloatField(read_only=True)

    class Meta:
        model = ParentLoginLog
        fields = (
            'id',
            'parent',
            'parent_name',
            'user',
            'email',
            'ip_address',
            'user_agent',
            'login_time',
            'logout_time',
            'session_duration',
        )
        read_only_fields = fields

    def get_parent_name(self, obj):
        return obj.user.get_full_name() or obj.user.email


class LinkedChildSerializer(serializers.ModelSerializer):
    """Summary of a student linked to the authenticated parent — used to
    resolve which child(ren) a parent may view without trusting an LRN the
    client supplies."""

    full_name = serializers.CharField(read_only=True)
    section_name = serializers.CharField(source='section.name', read_only=True, default='')
    academic_year_label = serializers.CharField(source='academic_year.label', read_only=True)

    class Meta:
        model = StudentProfile
        fields = (
            'id',
            'lrn',
            'full_name',
            'grade_level',
            'section_name',
            'academic_year_label',
            'is_active',
        )
