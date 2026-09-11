"""Enrollment forecasting service.

Computes a projection from real enrollment / section / school-year data when the
database holds enough history. When data is insufficient, returns structured demo
data with ``demo_mode=True`` so the frontend can clearly indicate the fallback.
"""
from apps.enrollment.models import AcademicYear, Enrollment, Section
from apps.students.models import StudentProfile

# Minimum distinct years with enrollment data required for a real projection.
MIN_YEARS_FOR_PROJECTION = 2

DEMO_HISTORY = [
    {'year': '2023-2024', 'count': 1820},
    {'year': '2024-2025', 'count': 1940},
    {'year': '2025-2026', 'count': 2065},
]


def _approved_count(academic_year):
    return Enrollment.objects.filter(
        academic_year=academic_year,
        admin_status=Enrollment.Status.APPROVED,
    ).count()


def _linear_projection(history):
    """Project the next point using average year-over-year growth."""
    counts = [h['count'] for h in history]
    deltas = [counts[i + 1] - counts[i] for i in range(len(counts) - 1)]
    avg_delta = sum(deltas) / len(deltas) if deltas else 0
    last = counts[-1]
    projected = max(0, round(last + avg_delta))
    growth_rate = round((avg_delta / last) * 100, 2) if last else 0.0
    return projected, growth_rate


def _next_year_label(label):
    try:
        start, end = label.split('-')
        return f'{int(start) + 1}-{int(end) + 1}'
    except (ValueError, AttributeError):
        return 'Next Year'


def build_enrollment_forecast(academic_year=None):
    years = list(AcademicYear.objects.order_by('label'))

    history = [
        {'year': y.label, 'count': _approved_count(y)}
        for y in years
    ]
    history = [h for h in history if h['count'] > 0]

    demo_mode = len(history) < MIN_YEARS_FOR_PROJECTION
    if demo_mode:
        history = DEMO_HISTORY

    projected_count, growth_rate = _linear_projection(history)
    current = history[-1]
    next_label = _next_year_label(current['year'])

    # Per-grade-level breakdown for the current/target year (real when available).
    current_year_obj = (
        AcademicYear.objects.filter(label=current['year']).first()
        if not demo_mode
        else None
    )
    by_grade_level = []
    if current_year_obj:
        rows = (
            StudentProfile.objects.filter(
                academic_year=current_year_obj, is_active=True
            )
            .values_list('grade_level', flat=True)
        )
        counts = {}
        for gl in rows:
            counts[gl or 'Unspecified'] = counts.get(gl or 'Unspecified', 0) + 1
        by_grade_level = [
            {'grade_level': k, 'count': v} for k, v in sorted(counts.items())
        ]

    total_sections = (
        Section.objects.filter(academic_year=current_year_obj).count()
        if current_year_obj
        else 0
    )

    return {
        'demo_mode': demo_mode,
        'current_year': current['year'],
        'current_total': current['count'],
        'total_sections': total_sections,
        'projected_year': next_label,
        'projected_total': projected_count,
        'growth_rate': growth_rate,
        'history': history,
        'by_grade_level': by_grade_level,
    }
