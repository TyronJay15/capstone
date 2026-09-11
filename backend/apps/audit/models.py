from django.conf import settings
from django.db import models


class AuditTrail(models.Model):
    """Persistent audit trail of significant actions across the portal.

    Renamed concept from the old "History"; head-teacher and admin views read
    these records grouped by module.
    """

    class Module(models.TextChoices):
        PROFILE = 'profile', 'Profile Update'
        GRADE_ENCODING = 'grade_encoding', 'Grade Encoding'
        GRADE_APPROVAL = 'grade_approval', 'Grade Approval'
        SECTION_CREATION = 'section_creation', 'Section Creation'
        TEACHER_ASSIGNMENT = 'teacher_assignment', 'Subject Teacher Assignment'
        ADVISER_ASSIGNMENT = 'adviser_assignment', 'Adviser Assignment'
        RECOMMENDATION = 'recommendation', 'Recommendation Generation'
        FORECAST = 'forecast', 'Enrollment Forecast Generation'
        ENROLLMENT = 'enrollment', 'Enrollment Decision'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_entries',
    )
    actor_label = models.CharField(
        max_length=150,
        blank=True,
        help_text='Snapshot of the acting user (kept even if the user is deleted).',
    )
    module = models.CharField(max_length=32, choices=Module.choices, db_index=True)
    action = models.CharField(max_length=255)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'audit_trail'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['module', 'created_at']),
        ]

    def __str__(self):
        return f'[{self.module}] {self.action}'
