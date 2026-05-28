from django.core.management.base import BaseCommand

from apps.enrollment.models import AcademicYear, Enrollment, Section


SEED_YEARS = ['2024-2025', '2025-2026', '2026-2027']
DEFAULT_YEAR = '2025-2026'
SECTION_NAMES = ['Unassigned', 'Einstein', 'Curie', 'Newton', 'Turing']

SEED_ENROLLMENTS = [
    {
        'lrn': '2025-001',
        'first_name': 'Maria',
        'last_name': 'Santos',
        'previous_school': 'Pulilan Elementary School',
        'grade_level_enrollment': 'Grade 10',
        'grade_level_current': 'Grade 9',
        'section': 'Einstein',
        'registrar_status': 'approved',
        'admin_status': 'approved',
        'submitted_info': 'LRN + SF9 + birth certificate',
        'parent_consent': True,
    },
    {
        'lrn': '2025-002',
        'first_name': 'Juan',
        'last_name': 'Dela Cruz',
        'previous_school': 'Sta. Maria High School',
        'grade_level_enrollment': 'Grade 10',
        'grade_level_current': 'Grade 9',
        'section': 'Einstein',
        'registrar_status': 'approved',
        'admin_status': 'approved',
        'submitted_info': 'Good moral + report card',
        'parent_consent': False,
    },
    {
        'lrn': '2025-003',
        'first_name': 'Ana',
        'last_name': 'Rodriguez',
        'previous_school': 'Bulacan National High School',
        'grade_level_enrollment': 'Grade 9',
        'grade_level_current': 'Grade 8',
        'section': 'Curie',
        'registrar_status': 'approved',
        'admin_status': 'pending',
        'submitted_info': 'Complete packet',
        'parent_consent': True,
    },
    {
        'lrn': '2025-004',
        'first_name': 'Carlos',
        'last_name': 'Mendoza',
        'previous_school': 'San Jose School',
        'grade_level_enrollment': 'Grade 8',
        'grade_level_current': 'Grade 7',
        'section': 'Unassigned',
        'registrar_status': 'rejected',
        'admin_status': 'pending',
        'submitted_info': 'Missing LRN',
        'parent_consent': False,
    },
    {
        'lrn': '2026-901',
        'first_name': 'Luis',
        'last_name': 'Ramos',
        'previous_school': 'Transfer applicant',
        'grade_level_enrollment': 'Grade 7',
        'grade_level_current': '',
        'section': 'Unassigned',
        'registrar_status': 'pending',
        'admin_status': 'pending',
        'submitted_info': 'LRN + birth certificate uploaded',
        'parent_consent': False,
    },
    {
        'lrn': '2026-902',
        'first_name': 'Paula',
        'last_name': 'Navarro',
        'previous_school': 'Transfer applicant',
        'grade_level_enrollment': 'Grade 7',
        'grade_level_current': '',
        'section': 'Unassigned',
        'registrar_status': 'approved',
        'admin_status': 'pending',
        'submitted_info': 'Report card + good moral',
        'parent_consent': False,
    },
]


class Command(BaseCommand):
    help = 'Seed academic years, sections, and sample enrollments.'

    def handle(self, *args, **options):
        years = {}
        for label in SEED_YEARS:
            year, _ = AcademicYear.objects.get_or_create(
                label=label,
                defaults={'is_current': label == DEFAULT_YEAR},
            )
            years[label] = year
            for section_name in SECTION_NAMES:
                Section.objects.get_or_create(academic_year=year, name=section_name)

        AcademicYear.objects.update(is_current=False)
        years[DEFAULT_YEAR].is_current = True
        years[DEFAULT_YEAR].save(update_fields=['is_current'])

        year = years[DEFAULT_YEAR]
        created = 0
        for row in SEED_ENROLLMENTS:
            section = Section.objects.get(academic_year=year, name=row['section'])
            _, was_created = Enrollment.objects.get_or_create(
                lrn=row['lrn'],
                academic_year=year,
                defaults={
                    'first_name': row['first_name'],
                    'middle_name': '',
                    'last_name': row['last_name'],
                    'previous_school': row['previous_school'],
                    'grade_level_enrollment': row['grade_level_enrollment'],
                    'grade_level_current': row['grade_level_current'],
                    'section': section,
                    'registrar_status': row['registrar_status'],
                    'admin_status': row['admin_status'],
                    'submitted_info': row['submitted_info'],
                    'parent_consent': row['parent_consent'],
                },
            )
            if was_created:
                created += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'Seed complete: {len(SEED_YEARS)} years, {created} new enrollments.'
            )
        )
