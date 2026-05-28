"""Grade encoding business logic for teachers and staff."""
from decimal import Decimal, InvalidOperation

from django.db import transaction
from django.db.models import Q

from apps.enrollment.models import Enrollment
from apps.students.models import StudentProfile
from apps.teachers.models import TeacherAssignment
from shared.permissions.roles import Role

from ..models import GradeRecord, Semester, Subject

MIN_SCORE = Decimal('0')
MAX_SCORE = Decimal('100')


class GradeServiceError(Exception):
    def __init__(self, message, code='error'):
        self.message = message
        self.code = code
        super().__init__(message)


def validate_score(value) -> Decimal:
    try:
        score = Decimal(str(value))
    except (InvalidOperation, TypeError) as exc:
        raise GradeServiceError('Grade must be a valid number.', code='invalid_score') from exc
    if score < MIN_SCORE or score > MAX_SCORE:
        raise GradeServiceError('Grade must be between 0 and 100.', code='invalid_score')
    return score.quantize(Decimal('0.01'))


def _assignment_filter_q(assignment: TeacherAssignment) -> Q:
    cond = Q(
        subject_id=assignment.subject_id,
        student__academic_year_id=assignment.academic_year_id,
        student__is_active=True,
    )
    if assignment.grade_level:
        cond &= Q(student__grade_level=assignment.grade_level)
    if assignment.section_id:
        cond &= Q(student__section_id=assignment.section_id)
    return cond


def get_teacher_grade_queryset(user):
    assignments = TeacherAssignment.objects.filter(teacher=user).select_related(
        'subject', 'academic_year', 'section'
    )
    if not assignments.exists():
        return GradeRecord.objects.none()

    combined = Q()
    for assignment in assignments:
        combined |= _assignment_filter_q(assignment)

    return (
        GradeRecord.objects.filter(combined)
        .select_related('student', 'subject', 'semester', 'semester__academic_year')
        .distinct()
    )


def teacher_can_manage_grade(*, user, student: StudentProfile, subject: Subject) -> bool:
    if user.is_superuser or user.role in (Role.ADMIN, Role.REGISTRAR):
        return True
    if user.role != Role.TEACHER:
        return False

    assignments = TeacherAssignment.objects.filter(
        teacher=user,
        subject=subject,
        academic_year=student.academic_year_id,
    )
    for assignment in assignments:
        if assignment.grade_level and assignment.grade_level != student.grade_level:
            continue
        if assignment.section_id and assignment.section_id != student.section_id:
            continue
        return True
    return False


def student_has_parent_consent(student: StudentProfile) -> bool:
    return Enrollment.objects.filter(
        lrn=student.lrn,
        academic_year=student.academic_year,
        parent_consent=True,
    ).exists()


@transaction.atomic
def bulk_upsert_grades(*, user, semester: Semester, entries: list[dict]) -> dict:
    created = 0
    updated = 0
    errors = []

    for index, entry in enumerate(entries):
        try:
            student = entry['student']
            subject = entry['subject']
            score = validate_score(entry['score'])

            if not teacher_can_manage_grade(user=user, student=student, subject=subject):
                raise GradeServiceError(
                    'You are not assigned to encode grades for this student and subject.',
                    code='forbidden',
                )

            if semester.academic_year_id != student.academic_year_id:
                raise GradeServiceError(
                    'Semester must belong to the student academic year.',
                    code='invalid_semester',
                )

            record, was_created = GradeRecord.objects.get_or_create(
                student=student,
                subject=subject,
                semester=semester,
                defaults={'score': score, 'encoded_by': user},
            )
            if was_created:
                created += 1
            else:
                record.score = score
                record.encoded_by = user
                record.save(update_fields=['score', 'encoded_by', 'updated_at'])
                updated += 1
        except GradeServiceError as exc:
            errors.append({'index': index, 'error': exc.message, 'code': exc.code})
        except Exception as exc:
            errors.append({'index': index, 'error': str(exc), 'code': 'error'})

    return {'created': created, 'updated': updated, 'errors': errors}
