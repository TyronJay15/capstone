from rest_framework import serializers

from .models import TeacherAssignment


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
