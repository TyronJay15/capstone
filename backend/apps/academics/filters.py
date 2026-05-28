import django_filters
from django.db.models import Q

from .models import GradeRecord


class GradeRecordFilter(django_filters.FilterSet):
    student = django_filters.NumberFilter(field_name='student_id')
    student_lrn = django_filters.CharFilter(field_name='student__lrn')
    subject = django_filters.NumberFilter(field_name='subject_id')
    semester = django_filters.NumberFilter(field_name='semester_id')
    section = django_filters.CharFilter(field_name='student__section__name')
    grade_level = django_filters.CharFilter(field_name='student__grade_level')
    academic_year = django_filters.NumberFilter(field_name='student__academic_year_id')
    academic_year_label = django_filters.CharFilter(field_name='student__academic_year__label')

    class Meta:
        model = GradeRecord
        fields = (
            'student',
            'student_lrn',
            'subject',
            'semester',
            'section',
            'grade_level',
            'academic_year',
            'academic_year_label',
        )
