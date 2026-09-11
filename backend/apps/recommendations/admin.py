from django.contrib import admin

from .models import CourseRecommendation


@admin.register(CourseRecommendation)
class CourseRecommendationAdmin(admin.ModelAdmin):
    list_display = (
        'student',
        'top_course',
        'confidence_score',
        'version',
        'is_latest',
        'academic_year',
        'section',
        'generated_at',
    )
    list_filter = ('is_latest', 'academic_year', 'section', 'strand')
    search_fields = ('student__lrn', 'student__first_name', 'student__last_name', 'top_course')
    readonly_fields = ('generated_at',)
