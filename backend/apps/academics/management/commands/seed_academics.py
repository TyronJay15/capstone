from django.core.management.base import BaseCommand

from apps.academics.models import GradeRecord, Semester, Subject
from apps.enrollment.services import get_current_academic_year
from apps.students.models import StudentProfile

SUBJECTS = [
    ('mathematics', 'Mathematics'),
    ('english', 'English'),
    ('science', 'Science'),
    ('filipino', 'Filipino'),
    ('social-studies', 'Social Studies'),
    ('pe', 'Physical Education'),
    ('values', 'Values Education'),
    ('computer-science', 'Computer Science'),
]

# LRN -> list of (1st sem scores, 2nd sem scores or None)
STUDENT_GRADES = {
    '2025-001': (
        [92, 88, 95, 90, 87, 94, 91, 89],
        None,
    ),
    '2025-002': (
        [85, 92, 88, 86, 90, 93, 89, 87],
        None,
    ),
    '2025-003': (
        None,
        [94, 91, 96, 88, 92, 90, 93, 95],
    ),
    '2025-004': (
        None,
        [89, 87, 91, 85, 88, 92, 86, 90],
    ),
    '2025-005': (
        [96, 94, 98, 92, 95, 89, 97, 93],
        None,
    ),
}


class Command(BaseCommand):
    help = 'Seed subjects, semesters, and sample grades for approved students.'

    def handle(self, *args, **options):
        year = get_current_academic_year()
        if not year:
            self.stderr.write('No academic year found. Run seed_enrollment first.')
            return

        subjects = []
        for code, name in SUBJECTS:
            subj, _ = Subject.objects.get_or_create(code=code, defaults={'name': name})
            subjects.append(subj)

        sem1, _ = Semester.objects.get_or_create(
            academic_year=year,
            code=Semester.Term.FIRST,
            defaults={'label': '1st Semester', 'is_current': True},
        )
        sem2, _ = Semester.objects.get_or_create(
            academic_year=year,
            code=Semester.Term.SECOND,
            defaults={'label': '2nd Semester', 'is_current': False},
        )

        grades_created = 0
        for lrn, (first_scores, second_scores) in STUDENT_GRADES.items():
            student = StudentProfile.objects.filter(lrn=lrn).first()
            if not student:
                continue
            if first_scores:
                for subject, score in zip(subjects, first_scores):
                    _, created = GradeRecord.objects.get_or_create(
                        student=student,
                        subject=subject,
                        semester=sem1,
                        defaults={'score': score},
                    )
                    if created:
                        grades_created += 1
            if second_scores:
                for subject, score in zip(subjects, second_scores):
                    _, created = GradeRecord.objects.get_or_create(
                        student=student,
                        subject=subject,
                        semester=sem2,
                        defaults={'score': score},
                    )
                    if created:
                        grades_created += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'Seeded {len(subjects)} subjects, {grades_created} grade records.'
            )
        )
