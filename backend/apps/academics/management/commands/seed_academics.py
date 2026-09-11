from django.core.management.base import BaseCommand

from apps.academics.models import GradeRecord, Subject, Term
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

# LRN -> tuple of (1st term scores, 2nd term scores, 3rd term scores); None to skip a term
STUDENT_GRADES = {
    '2025-001': (
        [92, 88, 95, 90, 87, 94, 91, 89],
        [93, 89, 96, 91, 88, 95, 92, 90],
        [94, 90, 97, 92, 89, 96, 93, 91],
    ),
    '2025-002': (
        [85, 92, 88, 86, 90, 93, 89, 87],
        [86, 93, 89, 87, 91, 94, 90, 88],
        None,
    ),
    '2025-003': (
        [94, 91, 96, 88, 92, 90, 93, 95],
        [95, 92, 97, 89, 93, 91, 94, 96],
        [96, 93, 98, 90, 94, 92, 95, 97],
    ),
    '2025-004': (
        [89, 87, 91, 85, 88, 92, 86, 90],
        None,
        None,
    ),
    '2025-005': (
        [96, 94, 98, 92, 95, 89, 97, 93],
        [97, 95, 99, 93, 96, 90, 98, 94],
        [98, 96, 99, 94, 97, 91, 99, 95],
    ),
}


class Command(BaseCommand):
    help = 'Seed subjects, terms, and sample grades for approved students.'

    def handle(self, *args, **options):
        year = get_current_academic_year()
        if not year:
            self.stderr.write('No academic year found. Run seed_enrollment first.')
            return

        subjects = []
        for code, name in SUBJECTS:
            subj, _ = Subject.objects.get_or_create(code=code, defaults={'name': name})
            subjects.append(subj)

        term_specs = [
            (Term.Code.FIRST, '1st Term', True),
            (Term.Code.SECOND, '2nd Term', False),
            (Term.Code.THIRD, '3rd Term', False),
        ]
        terms = []
        for code, label, is_current in term_specs:
            term, _ = Term.objects.get_or_create(
                academic_year=year,
                code=code,
                defaults={'label': label, 'is_current': is_current},
            )
            terms.append(term)

        grades_created = 0
        for lrn, term_scores in STUDENT_GRADES.items():
            student = StudentProfile.objects.filter(lrn=lrn).first()
            if not student:
                continue
            for term, scores in zip(terms, term_scores):
                if not scores:
                    continue
                for subject, score in zip(subjects, scores):
                    _, created = GradeRecord.objects.get_or_create(
                        student=student,
                        subject=subject,
                        term=term,
                        defaults={'score': score},
                    )
                    if created:
                        grades_created += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'Seeded {len(subjects)} subjects, {len(terms)} terms, {grades_created} grade records.'
            )
        )
