from django.conf import settings
from django.db import models


class Semester(models.Model):
    class Term(models.TextChoices):
        FIRST = '1st_sem', '1st Semester'
        SECOND = '2nd_sem', '2nd Semester'

    academic_year = models.ForeignKey(
        'enrollment.AcademicYear',
        on_delete=models.CASCADE,
        related_name='semesters',
    )
    code = models.CharField(max_length=16, choices=Term.choices)
    label = models.CharField(max_length=32)
    is_current = models.BooleanField(default=False)

    class Meta:
        db_table = 'academics_semesters'
        constraints = [
            models.UniqueConstraint(
                fields=['academic_year', 'code'],
                name='unique_semester_per_year',
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
    semester = models.ForeignKey(
        Semester,
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
                fields=['student', 'subject', 'semester'],
                name='unique_grade_per_student_subject_semester',
            ),
        ]
        indexes = [
            models.Index(fields=['student', 'semester']),
        ]

    def __str__(self):
        return f'{self.student.lrn} — {self.subject.name}: {self.score}'
