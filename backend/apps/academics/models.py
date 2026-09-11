from django.conf import settings
from django.db import models


class Term(models.Model):
    class Code(models.TextChoices):
        FIRST = '1st_term', '1st Term'
        SECOND = '2nd_term', '2nd Term'
        THIRD = '3rd_term', '3rd Term'

    academic_year = models.ForeignKey(
        'enrollment.AcademicYear',
        on_delete=models.CASCADE,
        related_name='terms',
    )
    code = models.CharField(max_length=16, choices=Code.choices)
    label = models.CharField(max_length=32)
    is_current = models.BooleanField(default=False)

    class Meta:
        db_table = 'academics_terms'
        constraints = [
            models.UniqueConstraint(
                fields=['academic_year', 'code'],
                name='unique_term_per_year',
            ),
        ]

    def __str__(self):
        return f'{self.label} ({self.academic_year.label})'


class Subject(models.Model):
    code = models.SlugField(max_length=32, unique=True)
    name = models.CharField(max_length=128)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'academics_subjects'
        ordering = ['name']

    def __str__(self):
        return self.name


class GradeRecord(models.Model):
    student = models.ForeignKey(
        'students.StudentProfile',
        on_delete=models.CASCADE,
        related_name='grades',
    )
    subject = models.ForeignKey(
        Subject,
        on_delete=models.PROTECT,
        related_name='grade_records',
    )
    term = models.ForeignKey(
        Term,
        on_delete=models.PROTECT,
        related_name='grade_records',
    )
    score = models.DecimalField(max_digits=5, decimal_places=2)
    encoded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='encoded_grades',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'academics_grade_records'
        constraints = [
            models.UniqueConstraint(
                fields=['student', 'subject', 'term'],
                name='unique_grade_per_student_subject_term',
            ),
        ]
        indexes = [
            models.Index(fields=['student', 'term'], name='academics_g_student_term_idx'),
        ]

    def __str__(self):
        return f'{self.student.lrn} — {self.subject.name}: {self.score}'
