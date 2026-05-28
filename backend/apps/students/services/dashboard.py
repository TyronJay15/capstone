"""Build student dashboard payloads for the React frontend."""
from django.contrib.auth import get_user_model

from apps.academics.models import GradeRecord, Semester
from apps.students.models import ParentStudentLink, StudentProfile
from shared.permissions.roles import Role

User = get_user_model()

SEMESTER_SHORT = {
    '1st Semester': '1st Sem',
    '2nd Semester': '2nd Sem',
}


def semester_to_short(label: str) -> str:
    return SEMESTER_SHORT.get(label, label)


def get_current_semester_label(profile: StudentProfile) -> str:
    semester = (
        Semester.objects.filter(academic_year=profile.academic_year, is_current=True)
        .order_by('code')
        .first()
    )
    if semester:
        return semester.label
    return '1st Semester'


def format_grades_for_student(profile: StudentProfile) -> list[dict]:
    records = (
        GradeRecord.objects.filter(student=profile)
        .select_related('subject', 'semester')
        .order_by('subject__name')
    )
    return [
        {
            'subject': record.subject.name,
            'grade': float(record.score),
            'semester': semester_to_short(record.semester.label),
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
        'semester': get_current_semester_label(profile),
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

    if user.role in (Role.TEACHER, Role.REGISTRAR, Role.ADMIN) or user.is_superuser:
        if lrn:
            return (
                StudentProfile.objects.select_related('section', 'academic_year')
                .filter(lrn=lrn)
                .first()
            )
        return None

    return None
