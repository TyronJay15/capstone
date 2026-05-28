import uuid

from django.conf import settings
from django.db import models


class AcademicYear(models.Model):
    label = models.CharField(max_length=9, unique=True, help_text='e.g. 2025-2026')
    is_current = models.BooleanField(default=False, db_index=True)
    starts_on = models.DateField(null=True, blank=True)
    ends_on = models.DateField(null=True, blank=True)

    class Meta:
        db_table = 'enrollment_academic_years'
        ordering = ['-label']

    def __str__(self):
        return self.label

    def save(self, *args, **kwargs):
        if self.is_current:
            AcademicYear.objects.filter(is_current=True).exclude(pk=self.pk).update(
                is_current=False
            )
        super().save(*args, **kwargs)


class Strand(models.Model):
    """Senior high school strand / track (optional)."""

    code = models.SlugField(max_length=32, unique=True)
    name = models.CharField(max_length=128)

    class Meta:
        db_table = 'enrollment_strands'
        ordering = ['name']

    def __str__(self):
        return self.name


class Section(models.Model):
    academic_year = models.ForeignKey(
        AcademicYear,
        on_delete=models.CASCADE,
        related_name='sections',
    )
    name = models.CharField(max_length=64)
    grade_level = models.CharField(max_length=32, blank=True)

    class Meta:
        db_table = 'enrollment_sections'
        ordering = ['name']
        constraints = [
            models.UniqueConstraint(
                fields=['academic_year', 'name'],
                name='unique_section_per_year',
            ),
        ]
        indexes = [
            models.Index(fields=['academic_year', 'name']),
        ]

    def __str__(self):
        return f'{self.name} ({self.academic_year.label})'


class Enrollment(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        APPROVED = 'approved', 'Approved'
        REJECTED = 'rejected', 'Rejected'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    lrn = models.CharField(max_length=32, db_index=True)
    first_name = models.CharField(max_length=100)
    middle_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100)
    academic_year = models.ForeignKey(
        AcademicYear,
        on_delete=models.PROTECT,
        related_name='enrollments',
    )
    section = models.ForeignKey(
        Section,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='enrollments',
    )
    strand = models.ForeignKey(
        Strand,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='enrollments',
    )
    previous_school = models.CharField(max_length=255, blank=True)
    grade_level_enrollment = models.CharField(max_length=32, db_index=True)
    grade_level_current = models.CharField(max_length=32, blank=True)
    registrar_status = models.CharField(
        max_length=16,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
    )
    admin_status = models.CharField(
        max_length=16,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
    )
    submitted_info = models.TextField(blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True, db_index=True)
    parent_consent = models.BooleanField(default=False)
    parent_consent_by = models.CharField(max_length=150, blank=True)
    parent_consent_at = models.DateTimeField(null=True, blank=True)
    birthdate = models.DateField(null=True, blank=True)
    age = models.PositiveSmallIntegerField(null=True, blank=True)
    gender = models.CharField(max_length=32, blank=True)
    address = models.TextField(blank=True)
    contact_number = models.CharField(max_length=32, blank=True)
    school_name = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    reviewed_by_registrar = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='registrar_reviews',
    )
    reviewed_by_admin = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='admin_reviews',
    )

    class Meta:
        db_table = 'enrollment_applications'
        ordering = ['-submitted_at']
        constraints = [
            models.UniqueConstraint(
                fields=['lrn', 'academic_year'],
                name='unique_lrn_per_academic_year',
            ),
        ]
        indexes = [
            models.Index(fields=['academic_year', 'registrar_status']),
            models.Index(fields=['academic_year', 'admin_status']),
            models.Index(fields=['lrn']),
        ]

    def __str__(self):
        return f'{self.lrn} — {self.full_name}'

    @property
    def full_name(self):
        parts = [self.first_name, self.middle_name, self.last_name]
        return ' '.join(p for p in parts if p).strip()
