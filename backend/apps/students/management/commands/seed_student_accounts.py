from django.core.management.base import BaseCommand

from apps.students.models import StudentProfile
from apps.students.services.accounts import ensure_parent_student_link, ensure_student_user


class Command(BaseCommand):
    help = 'Create JWT login accounts for approved students and parent links.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--password',
            default='changeme123',
            help='Default password for student accounts',
        )

    def handle(self, *args, **options):
        password = options['password']
        count = 0
        for profile in StudentProfile.objects.filter(is_active=True):
            ensure_student_user(profile, password=password)
            count += 1

        link = ensure_parent_student_link('parent@dampol.edu.ph', '2025-001')
        self.stdout.write(
            self.style.SUCCESS(
                f'Ensured {count} student login accounts (LRN + password). '
                f'Parent link to 2025-001: {"ok" if link else "skipped"}.'
            )
        )
