from django.conf import settings
from django.db import models


class StudentProfile(models.Model):
    """Active student record after enrollment approval."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='student_profile',
    )
    enrollment = models.OneToOneField(
        'enrollment.Enrollment',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='student_profile',
    )
    lrn = models.CharField(max_length=32, unique=True, db_index=True)
    first_name = models.CharField(max_length=100)
    middle_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(blank=True)
    contact_number = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    profile_picture = models.ImageField(upload_to='profiles/', blank=True, null=True)
    guardian_name = models.CharField(max_length=100, blank=True)
    guardian_contact = models.CharField(max_length=20, blank=True)
    grade_level = models.CharField(max_length=32, db_index=True)
    section = models.ForeignKey(
        'enrollment.Section',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='students',
    )
    academic_year = models.ForeignKey(
        'enrollment.AcademicYear',
        on_delete=models.PROTECT,
        related_name='students',
    )
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'students_profiles'
        ordering = ['last_name', 'first_name']
        indexes = [
            models.Index(fields=['academic_year', 'section']),
            models.Index(fields=['lrn']),
        ]

    def __str__(self):
        return f'{self.lrn} — {self.full_name}'

    @property
    def full_name(self):
        parts = [self.first_name, self.middle_name, self.last_name]
        return ' '.join(p for p in parts if p).strip()


class ParentStudentLink(models.Model):
    parent = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='linked_students',
        limit_choices_to={'role': 'parent'},
    )
    student = models.ForeignKey(
        StudentProfile,
        on_delete=models.CASCADE,
        related_name='parent_links',
    )
    relationship = models.CharField(max_length=64, default='parent')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'students_parent_links'
        constraints = [
            models.UniqueConstraint(
                fields=['parent', 'student'],
                name='unique_parent_student_link',
            ),
        ]


class StudentLoginLog(models.Model):
    """Track student login activity."""

    student = models.ForeignKey(
        StudentProfile,
        on_delete=models.CASCADE,
        related_name='login_logs',
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='student_login_logs',
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
        db_table = 'students_login_logs'
        ordering = ['-login_time']
        indexes = [
            models.Index(fields=['student', 'login_time']),
            models.Index(fields=['user', 'login_time']),
        ]

    def __str__(self):
        return f'{self.student.lrn} — {self.login_time}'

    @property
    def session_duration(self):
        """Calculate session duration in seconds."""
        if self.logout_time:
            return (self.logout_time - self.login_time).total_seconds()
        return None
