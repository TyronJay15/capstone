"""Teacher roster and assignment helpers."""
from django.db.models import Exists, OuterRef, Q

from apps.academics.models import GradeRecord
from apps.enrollment.models import Enrollment
from apps.enrollment.services import derive_overall_status, get_current_academic_year
from apps.students.models import StudentProfile

from .models import TeacherAssignment


def get_teacher_student_queryset(user, *, academic_year=None):
    assignments = TeacherAssignment.objects.filter(teacher=user).select_related(
        'academic_year', 'section'
    )
    if not assignments.exists():
        return StudentProfile.objects.none()

    year = academic_year or get_current_academic_year()
    if not year:
        return StudentProfile.objects.none()

    student_q = Q()
    for assignment in assignments.filter(academic_year=year):
        cond = Q(academic_year=year, is_active=True)
        if assignment.grade_level:
            cond &= Q(grade_level=assignment.grade_level)
        if assignment.section_id:
            cond &= Q(section_id=assignment.section_id)
        student_q |= cond

    has_grades = GradeRecord.objects.filter(student_id=OuterRef('pk'))
    return (
        StudentProfile.objects.filter(student_q)
        .select_related('section', 'academic_year', 'enrollment')
        .annotate(has_grades=Exists(has_grades))
        .distinct()
    )


def filter_approved_roster(profiles):
    for profile in profiles:
        if profile.enrollment and derive_overall_status(profile.enrollment) != 'approved':
            continue
        yield profile


def build_teacher_roster_entry(profile: StudentProfile) -> dict:
    enrollment = profile.enrollment
    overall = derive_overall_status(enrollment) if enrollment else 'approved'
    return {
        'id': profile.lrn,
        'profileId': profile.id,
        'enrollmentId': str(enrollment.id) if enrollment else None,
        'name': profile.full_name,
        'grade': profile.grade_level,
        'section': profile.section.name if profile.section else 'Unassigned',
        'status': 'Active' if overall == 'approved' else 'Pending',
        'hasGrades': bool(getattr(profile, 'has_grades', False)),
        'parentConsent': bool(
            enrollment.parent_consent
            if enrollment
            else Enrollment.objects.filter(
                lrn=profile.lrn, academic_year=profile.academic_year, parent_consent=True
            ).exists()
        ),
    }
