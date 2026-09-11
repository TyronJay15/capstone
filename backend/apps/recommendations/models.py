from django.conf import settings
from django.db import models


class CourseRecommendation(models.Model):
    """A generated, versioned college course recommendation for a student.

    Every generation is stored as a new versioned row. The most recent row for a
    student is flagged ``is_latest=True`` so every stakeholder (student, parent,
    adviser, admin) always reads the same current recommendation.
    """

    student = models.ForeignKey(
        'students.StudentProfile',
        on_delete=models.CASCADE,
        related_name='course_recommendations',
    )
    academic_year = models.ForeignKey(
        'enrollment.AcademicYear',
        on_delete=models.CASCADE,
        related_name='course_recommendations',
    )
    section = models.ForeignKey(
        'enrollment.Section',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='course_recommendations',
    )
    top_course = models.CharField(max_length=128)
    strand = models.CharField(max_length=64, blank=True)
    # Confidence for the top course, expressed as a percentage (0–100).
    confidence_score = models.DecimalField(max_digits=5, decimal_places=2)
    # Convenience 0–10 score derived from confidence.
    recommendation_score = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    explanation = models.TextField(blank=True)
    # [{ "name": str, "confidence": int }]
    alternatives = models.JSONField(default=list, blank=True)
    # [int] recent grade trend
    trend = models.JSONField(default=list, blank=True)
    version = models.PositiveIntegerField(default=1)
    is_latest = models.BooleanField(default=True, db_index=True)
    generated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='generated_recommendations',
    )
    generated_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'recommendations_course'
        ordering = ['-generated_at']
        indexes = [
            models.Index(fields=['student', 'is_latest']),
            models.Index(fields=['academic_year', 'section']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['student', 'version'],
                name='unique_recommendation_version_per_student',
            ),
        ]

    def __str__(self):
        return f'{self.student.lrn} → {self.top_course} (v{self.version})'
