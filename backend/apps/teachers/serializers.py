from rest_framework import serializers

from .models import TeacherAssignment, TeacherLoginLog


class TeacherAssignmentSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    academic_year_label = serializers.CharField(source='academic_year.label', read_only=True)
    section_name = serializers.CharField(source='section.name', read_only=True, default='')

    class Meta:
        model = TeacherAssignment
        fields = (
            'id',
            'subject',
            'subject_name',
            'academic_year',
            'academic_year_label',
            'grade_level',
            'section',
            'section_name',
        )


class TeacherLoginLogSerializer(serializers.ModelSerializer):
    """Read-only teacher login history. Never exposes credentials."""

    teacher_name = serializers.SerializerMethodField()
    email = serializers.EmailField(source='user.email', read_only=True)
    session_duration = serializers.FloatField(read_only=True)

    class Meta:
        model = TeacherLoginLog
        fields = (
            'id',
            'user',
            'teacher_name',
            'email',
            'ip_address',
            'user_agent',
            'login_time',
            'logout_time',
            'session_duration',
        )
        read_only_fields = fields

    def get_teacher_name(self, obj):
        return obj.user.get_full_name() or obj.user.email
