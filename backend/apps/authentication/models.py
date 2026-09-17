from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models

from shared.permissions.roles import Role


class User(AbstractUser):
    """Custom user with role-based access for Grade Portal."""

    username = models.CharField(max_length=150, unique=True, blank=True, null=True)
    email = models.EmailField(unique=True)
    role = models.CharField(
        max_length=20,
        choices=[(r, r.replace('_', ' ').title()) for r in Role.ALL],
        default=Role.STUDENT,
        db_index=True,
    )
    student_lrn = models.CharField(
        max_length=32,
        blank=True,
        db_index=True,
        help_text='Learner reference number for student accounts.',
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    class Meta:
        db_table = 'auth_users'
        indexes = [
            models.Index(fields=['role', 'is_active']),
        ]

    def save(self, *args, **kwargs):
        if not self.username:
            self.username = self.email
        super().save(*args, **kwargs)

    def __str__(self):
        return self.email

    @property
    def is_student(self):
        return self.role == Role.STUDENT

    @property
    def is_staff_role(self):
        return self.role in Role.STAFF or self.role == Role.REGISTRAR


class LoginActivity(models.Model):
    """Successful login record for every role, powering the admin activity view.

    Identity fields are snapshots so the history stays readable even after an
    account is renamed or deleted.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='login_activities',
    )
    role = models.CharField(max_length=20, db_index=True)
    email = models.EmailField(blank=True)
    full_name = models.CharField(max_length=255, blank=True)
    student_lrn = models.CharField(
        max_length=32,
        blank=True,
        help_text='LRN of the student account, or of the child a parent signed in for.',
    )
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    logged_in_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'auth_login_activity'
        ordering = ['-logged_in_at']
        indexes = [
            models.Index(fields=['role', 'logged_in_at']),
        ]

    def __str__(self):
        return f'{self.email or self.full_name} ({self.role}) — {self.logged_in_at}'
