from django.conf import settings
from django.db import models


class TeacherAssignment(models.Model):
    """Maps teachers to subjects and optional section/grade scope."""

    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='teaching_assignments',
        limit_choices_to={'role': 'teacher'},
    )
    subject = models.ForeignKey(
        'academics.Subject',
        on_delete=models.CASCADE,
        related_name='teacher_assignments',
    )
    academic_year = models.ForeignKey(
        'enrollment.AcademicYear',
        on_delete=models.CASCADE,
        related_name='teacher_assignments',
    )
    grade_level = models.CharField(
        max_length=32,
        blank=True,
        help_text='Leave blank to include all grade levels in the academic year.',
    )
    section = models.ForeignKey(
        'enrollment.Section',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='teacher_assignments',
        help_text='Leave blank to include all sections for the grade level.',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'teachers_assignments'
        constraints = [
            models.UniqueConstraint(
                fields=['teacher', 'subject', 'academic_year', 'grade_level', 'section'],
                name='unique_teacher_assignment_scope',
            ),
        ]
        indexes = [
            models.Index(fields=['teacher', 'academic_year']),
        ]

    def __str__(self):
        scope = self.section.name if self.section else (self.grade_level or 'All')
        return f'{self.teacher.email} — {self.subject.name} ({scope})'
