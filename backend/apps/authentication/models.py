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
