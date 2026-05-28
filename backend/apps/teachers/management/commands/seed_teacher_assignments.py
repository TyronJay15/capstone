from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from apps.academics.models import Subject
from apps.enrollment.models import Section
from apps.enrollment.services import get_current_academic_year
from apps.teachers.models import TeacherAssignment

User = get_user_model()


class Command(BaseCommand):
    help = 'Assign demo teacher to all subjects for Grade 10 Einstein section.'

    def handle(self, *args, **options):
        teacher = User.objects.filter(email='teacher@dampol.edu.ph', role='teacher').first()
        if not teacher:
            self.stderr.write('Run seed_staff first to create teacher@dampol.edu.ph')
            return

        year = get_current_academic_year()
        if not year:
            self.stderr.write('No academic year found.')
            return

        section = Section.objects.filter(academic_year=year, name='Einstein').first()
        subjects = Subject.objects.filter(is_active=True)
        count = 0
        for subject in subjects:
            _, created = TeacherAssignment.objects.get_or_create(
                teacher=teacher,
                subject=subject,
                academic_year=year,
                grade_level='Grade 10',
                section=section,
                defaults={},
            )
            if created:
                count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'Teacher assignments ready: {count} new, {subjects.count()} subjects for Grade 10 Einstein.'
            )
        )
