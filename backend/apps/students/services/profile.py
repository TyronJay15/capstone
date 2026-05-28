"""
Profile-related services for student accounts.
"""
from django.db import transaction

from ..models import StudentProfile


def resolve_student_profile(user):
    """Resolve StudentProfile from authenticated user."""
    if not user or not user.is_authenticated:
        return None
    
    try:
        return StudentProfile.objects.select_related(
            'academic_year', 'section'
        ).get(user=user)
    except StudentProfile.DoesNotExist:
        return None


@transaction.atomic
def update_student_profile(user, profile_data):
    """
    Update student profile with provided data.
    
    Args:
        user: Authenticated User instance
        profile_data: Dict with updatable fields (first_name, middle_name, last_name, etc.)
    
    Returns:
        Updated StudentProfile instance
        
    Raises:
        StudentProfile.DoesNotExist: If student profile not found
    """
    profile = StudentProfile.objects.select_for_update().get(user=user)
    
    # Allowed updatable fields
    updatable_fields = [
        'first_name',
        'middle_name',
        'last_name',
        'email',
        'contact_number',
        'address',
        'profile_picture',
        'guardian_name',
        'guardian_contact',
    ]
    
    for field in updatable_fields:
        if field in profile_data:
            setattr(profile, field, profile_data[field])
    
    profile.save(update_fields=updatable_fields + ['updated_at'])
    return profile


def get_student_profile_data(user):
    """
    Fetch complete student profile data for authenticated user.
    
    Returns:
        StudentProfile instance or None
    """
    return resolve_student_profile(user)
