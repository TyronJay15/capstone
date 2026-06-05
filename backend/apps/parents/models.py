from django.conf import settings
from django.db import models


class ParentProfile(models.Model):
    """Parent account profile with contact information."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='parent_profile',
        limit_choices_to={'role': 'parent'},
    )
    phone_number = models.CharField(
        max_length=20,
        blank=True,
        help_text='Contact phone number',
    )
    address = models.TextField(
        blank=True,
        help_text='Home address',
    )
    profession = models.CharField(
        max_length=100,
        blank=True,
        help_text='Parent profession (optional)',
    )
    emergency_contact = models.CharField(
        max_length=100,
        blank=True,
        help_text='Emergency contact name',
    )
    emergency_phone = models.CharField(
        max_length=20,
        blank=True,
        help_text='Emergency contact number',
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        help_text='Whether this parent account is active',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'parents_profiles'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_active']),
        ]

    def __str__(self):
        return f'{self.user.email} — {self.user.get_full_name()}'
