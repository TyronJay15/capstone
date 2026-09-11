"""Build student dashboard payloads for the React frontend."""
from django.contrib.auth import get_user_model

from apps.academics.models import GradeRecord, Term
from apps.students.models import ParentStudentLink, StudentProfile
from shared.permissions.roles import Role

User = get_user_model()

TERM_SHORT = {
    '1st Term': '1st Term',
    '2nd Term': '2nd Term',
    '3rd Term': '3rd Term',
}


def term_to_short(label: str) -> str:
    return TERM_SHORT.get(label, label)


def get_current_term_label(profile: StudentProfile) -> str:
    term = (
        Term.objects.filter(academic_year=profile.academic_year, is_current=True)
        .order_by('code')
        .first()
    )
    if term:
        return term.label
    return '1st Term'


def format_grades_for_student(profile: StudentProfile) -> list[dict]:
    records = (
        GradeRecord.objects.filter(student=profile)
        .select_related('subject', 'term')
        .order_by('subject__name')
    )
    return [
        {
            'subject': record.subject.name,
            'grade': float(record.score),
            'term': term_to_short(record.term.label),
        }
        for record in records
    ]


def build_dashboard_payload(profile: StudentProfile) -> dict:
    return {
        'id': profile.lrn,
        'name': profile.full_name,
        'email': profile.email or f'{profile.lrn}@dampol.edu.ph',
        'grade': profile.grade_level,
        'section': profile.section.name if profile.section else 'Unassigned',
        'term': get_current_term_label(profile),
        'grades': format_grades_for_student(profile),
    }


def resolve_student_profile(user, lrn: str | None = None) -> StudentProfile | None:
    if user.role == Role.STUDENT:
        if user.student_lrn:
            return (
                StudentProfile.objects.select_related('section', 'academic_year')
                .filter(lrn=user.student_lrn, is_active=True)
                .first()
            )
        return getattr(user, 'student_profile', None)

    if user.role == Role.PARENT:
        if not lrn:
            return None
        student = (
            StudentProfile.objects.select_related('section', 'academic_year')
            .filter(lrn=lrn, is_active=True)
            .first()
        )
        if not student:
            return None
        if ParentStudentLink.objects.filter(parent=user, student=student).exists():
            return student
        return None

    if user.role in Role.STAFF or user.is_superuser:
        if lrn:
            return (
                StudentProfile.objects.select_related('section', 'academic_year')
                .filter(lrn=lrn)
                .first()
            )
        return None

    return None
