from rest_framework import serializers

from .models import CourseRecommendation


class CourseRecommendationSerializer(serializers.ModelSerializer):
    student_lrn = serializers.CharField(source='student.lrn', read_only=True)
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    section_name = serializers.CharField(source='section.name', read_only=True, default='')
    academic_year_label = serializers.CharField(
        source='academic_year.label', read_only=True
    )
    generated_by_name = serializers.SerializerMethodField()

    class Meta:
        model = CourseRecommendation
        fields = (
            'id',
            'student_lrn',
            'student_name',
            'section_name',
            'academic_year_label',
            'top_course',
            'strand',
            'confidence_score',
            'recommendation_score',
            'explanation',
            'alternatives',
            'trend',
            'version',
            'is_latest',
            'generated_by',
            'generated_by_name',
            'generated_at',
        )
        read_only_fields = fields

    def get_generated_by_name(self, obj):
        if not obj.generated_by:
            return ''
        return obj.generated_by.get_full_name() or obj.generated_by.email
