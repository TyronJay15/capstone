from django.core.management.base import BaseCommand

from apps.enrollment.models import Enrollment
from apps.enrollment.services import derive_overall_status
from apps.students.services import sync_student_from_enrollment


class Command(BaseCommand):
    help = 'Create student profiles from fully approved enrollments.'

    def handle(self, *args, **options):
        count = 0
        for enrollment in Enrollment.objects.select_related('academic_year', 'section'):
            if derive_overall_status(enrollment) != 'approved':
                continue
            sync_student_from_enrollment(enrollment)
            count += 1
        self.stdout.write(self.style.SUCCESS(f'Synced {count} student profiles.'))
