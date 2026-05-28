from django.db import transaction

from apps.enrollment.models import Enrollment
from apps.enrollment.services import derive_overall_status

from ..models import StudentProfile
from .accounts import ensure_student_user


@transaction.atomic
def sync_student_from_enrollment(enrollment: Enrollment) -> StudentProfile | None:
    if derive_overall_status(enrollment) != 'approved':
        return None

    profile, _ = StudentProfile.objects.update_or_create(
        lrn=enrollment.lrn,
        defaults={
            'enrollment': enrollment,
            'first_name': enrollment.first_name,
            'middle_name': enrollment.middle_name,
            'last_name': enrollment.last_name,
            'email': f'{enrollment.lrn}@dampol.edu.ph',
            'grade_level': enrollment.grade_level_enrollment,
            'section': enrollment.section,
            'academic_year': enrollment.academic_year,
            'is_active': True,
        },
    )
    ensure_student_user(profile)
    return profile
