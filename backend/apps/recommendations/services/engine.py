"""Course recommendation generation service.

Frontend-aligned, deterministic recommendation engine. Mirrors the shape the
React `recommendationStore` expects so the UI needs no redesign when wired up.

Business rules:
- Only the College Course Recommendation exists (Academic Recommendation removed).
- Each generation is persisted as a new version; the previous latest is demoted.
- The latest recommendation is what every stakeholder retrieves.
"""
from decimal import Decimal

from django.db import transaction

from ..models import CourseRecommendation

COURSE_POOL = {
    'STEM': [
        ('BS Information Technology', 88),
        ('BS Computer Science', 84),
        ('BS Civil Engineering', 78),
        ('BS Data Science', 74),
    ],
    'ABM': [
        ('BS Accountancy', 86),
        ('BS Business Administration', 82),
        ('BS Management Accounting', 77),
        ('BS Economics', 72),
    ],
    'HUMSS': [
        ('AB Communication', 85),
        ('BS Psychology', 81),
        ('AB Political Science', 76),
        ('BS Education', 71),
    ],
    'DEFAULT': [
        ('BS Information Technology', 80),
        ('BS Business Administration', 76),
        ('AB Communication', 72),
        ('BS Education', 68),
    ],
}


class RecommendationError(Exception):
    def __init__(self, message, code='recommendation_error'):
        self.message = message
        self.code = code
        super().__init__(message)


def _student_grade_values(student):
    """Recent numeric grades for a student, ordered oldest→newest."""
    qs = (
        student.grades.select_related('term')
        .order_by('term__id', 'subject__name')
        .values_list('score', flat=True)
    )
    return [float(v) for v in qs]


def _resolve_strand(student):
    enrollment = getattr(student, 'enrollment', None)
    if enrollment and getattr(enrollment, 'strand', None):
        return (enrollment.strand.code or enrollment.strand.name or '').upper()
    return ''


def get_latest_recommendation(student):
    return (
        CourseRecommendation.objects.select_related('academic_year', 'section')
        .filter(student=student, is_latest=True)
        .first()
    )


@transaction.atomic
def generate_recommendation(student, user=None):
    """Build + persist a new versioned recommendation for ``student``."""
    if student.academic_year_id is None:
        raise RecommendationError(
            'Student has no academic year assigned.', code='no_academic_year'
        )

    strand = _resolve_strand(student)
    pool = COURSE_POOL.get(strand, COURSE_POOL['DEFAULT'])

    grades = _student_grade_values(student)
    avg = sum(grades) / len(grades) if grades else 85.0
    adjust = round((avg - 85) * 0.6)

    ranked = sorted(
        ((name, max(40, min(99, base + adjust))) for name, base in pool),
        key=lambda item: item[1],
        reverse=True,
    )
    top_name, top_conf = ranked[0]

    previous = (
        CourseRecommendation.objects.select_for_update()
        .filter(student=student)
        .order_by('-version')
        .first()
    )
    next_version = (previous.version + 1) if previous else 1

    CourseRecommendation.objects.filter(student=student, is_latest=True).update(
        is_latest=False
    )

    record = CourseRecommendation.objects.create(
        student=student,
        academic_year=student.academic_year,
        section=student.section,
        top_course=top_name,
        strand=strand or (student.enrollment.strand.name if getattr(student, 'enrollment', None) and student.enrollment.strand else ''),
        confidence_score=Decimal(str(top_conf)),
        recommendation_score=Decimal(str(round(top_conf / 10, 1))),
        explanation=(
            f'Based on a running average of {avg:.1f} and consistent performance '
            f'aligned with the {strand or "chosen"} strand, {top_name} is the '
            f'strongest college course match.'
        ),
        alternatives=[{'name': n, 'confidence': c} for n, c in ranked[1:]],
        trend=[int(round(g)) for g in grades[-6:]] or [82, 84, 83, 87, 90, 92],
        version=next_version,
        is_latest=True,
        generated_by=user if (user and getattr(user, 'is_authenticated', False)) else None,
    )
    return record


def get_section_recommendation_summary(academic_year=None):
    """Latest recommendations grouped School Year → Section → Student.

    Returns a list of section buckets for the admin/head-teacher summary view.
    """
    qs = (
        CourseRecommendation.objects.select_related(
            'student', 'section', 'academic_year'
        )
        .filter(is_latest=True)
        .order_by('academic_year__label', 'section__name', 'student__last_name')
    )
    if academic_year is not None:
        qs = qs.filter(academic_year=academic_year)

    buckets = {}
    for rec in qs:
        section_name = rec.section.name if rec.section else 'Unassigned'
        key = (rec.academic_year.label, section_name)
        bucket = buckets.setdefault(
            key,
            {
                'school_year': rec.academic_year.label,
                'section': section_name,
                'strand': rec.strand,
                'students': [],
            },
        )
        bucket['students'].append(
            {
                'lrn': rec.student.lrn,
                'name': rec.student.full_name,
                'top_course': rec.top_course,
                'confidence_score': float(rec.confidence_score),
                'version': rec.version,
                'generated_at': rec.generated_at.isoformat(),
            }
        )
    return list(buckets.values())
