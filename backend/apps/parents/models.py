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


class ParentLoginLog(models.Model):
    """Track parent login activity.

    Mirrors ``apps.students.StudentLoginLog``. ``parent`` is nullable so a
    sign-in is still recorded when the parent has no ParentProfile row yet,
    and so history survives if that profile is later removed.
    """

    parent = models.ForeignKey(
        ParentProfile,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='login_logs',
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='parent_login_logs',
    )
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text='IP address of the login request',
    )
    user_agent = models.TextField(
        blank=True,
        help_text='User agent (browser/device info)',
    )
    login_time = models.DateTimeField(auto_now_add=True, db_index=True)
    logout_time = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'parents_login_logs'
        ordering = ['-login_time']
        indexes = [
            models.Index(fields=['user', 'login_time']),
        ]

    def __str__(self):
        return f'{self.user.email} — {self.login_time}'

    @property
    def session_duration(self):
        """Session duration in seconds, or None while still signed in."""
        if self.logout_time:
            return (self.logout_time - self.login_time).total_seconds()
        return None
