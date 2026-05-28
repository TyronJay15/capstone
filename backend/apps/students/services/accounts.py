"""Create and link student user accounts."""
import os

from django.contrib.auth import get_user_model
from django.db import transaction

from apps.students.models import ParentStudentLink, StudentProfile
from shared.permissions.roles import Role

User = get_user_model()

DEFAULT_STUDENT_PASSWORD = os.environ.get('DEFAULT_STUDENT_PASSWORD', 'changeme123')


@transaction.atomic
def ensure_student_user(profile: StudentProfile, *, password: str | None = None) -> User:
    email = profile.email or f'{profile.lrn}@dampol.edu.ph'
    user, created = User.objects.get_or_create(
        email=email,
        defaults={
            'username': email,
            'first_name': profile.first_name,
            'last_name': profile.last_name,
            'role': Role.STUDENT,
            'student_lrn': profile.lrn,
            'is_active': profile.is_active,
        },
    )
    pwd = password or DEFAULT_STUDENT_PASSWORD
    if created:
        user.set_password(pwd)
    user.role = Role.STUDENT
    user.student_lrn = profile.lrn
    user.first_name = profile.first_name
    user.last_name = profile.last_name
    user.is_active = profile.is_active
    user.save()

    if profile.user_id != user.id:
        profile.user = user
        profile.save(update_fields=['user', 'updated_at'])

    return user


@transaction.atomic
def ensure_parent_student_link(parent_email: str, student_lrn: str) -> ParentStudentLink | None:
    parent = User.objects.filter(email=parent_email, role=Role.PARENT).first()
    student = StudentProfile.objects.filter(lrn=student_lrn).first()
    if not parent or not student:
        return None
    link, _ = ParentStudentLink.objects.get_or_create(
        parent=parent,
        student=student,
        defaults={'relationship': 'parent'},
    )
    return link
