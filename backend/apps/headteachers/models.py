from django.conf import settings
from django.db import models


class AdviserAssignment(models.Model):
    """Assigns a class adviser (a staff user) to a section for a school year.

    One adviser per section (enforced by the OneToOne on section).
    """

    section = models.OneToOneField(
        'enrollment.Section',
        on_delete=models.CASCADE,
        related_name='adviser_assignment',
    )
    adviser = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='adviser_sections',
    )
    academic_year = models.ForeignKey(
        'enrollment.AcademicYear',
        on_delete=models.CASCADE,
        related_name='adviser_assignments',
    )
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='adviser_assignments_made',
    )
    assigned_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'headteacher_adviser_assignments'
        ordering = ['section__name']
        indexes = [
            models.Index(fields=['academic_year', 'adviser']),
        ]

    def __str__(self):
        return f'{self.adviser} → {self.section}'
