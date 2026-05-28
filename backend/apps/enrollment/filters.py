import django_filters
from django.db.models import Q

from .models import Enrollment


class EnrollmentFilter(django_filters.FilterSet):
    academic_year = django_filters.NumberFilter(field_name='academic_year_id')
    academic_year_label = django_filters.CharFilter(field_name='academic_year__label')
    registrar_status = django_filters.CharFilter()
    admin_status = django_filters.CharFilter()
    section = django_filters.CharFilter(field_name='section__name')
    grade_level = django_filters.CharFilter(field_name='grade_level_enrollment')
    lrn = django_filters.CharFilter(lookup_expr='icontains')
    search = django_filters.CharFilter(method='filter_search')

    class Meta:
        model = Enrollment
        fields = (
            'academic_year',
            'academic_year_label',
            'registrar_status',
            'admin_status',
            'section',
            'grade_level',
            'lrn',
        )

    def filter_search(self, queryset, name, value):
        if not value:
            return queryset
        return queryset.filter(
            Q(first_name__icontains=value)
            | Q(last_name__icontains=value)
            | Q(lrn__icontains=value)
            | Q(middle_name__icontains=value)
        )
