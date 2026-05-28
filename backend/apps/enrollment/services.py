"""Enrollment business logic."""
from django.db import transaction
from django.utils import timezone

from .models import AcademicYear, Enrollment, Section


class EnrollmentServiceError(Exception):
    def __init__(self, message, code='error'):
        self.message = message
        self.code = code
        super().__init__(message)


def derive_overall_status(enrollment: Enrollment) -> str:
    reg = enrollment.registrar_status
    adm = enrollment.admin_status
    if reg == Enrollment.Status.REJECTED or adm == Enrollment.Status.REJECTED:
        return 'rejected'
    if reg == Enrollment.Status.APPROVED and adm == Enrollment.Status.APPROVED:
        return 'approved'
    if reg == Enrollment.Status.APPROVED and adm == Enrollment.Status.PENDING:
        return 'pending_admin'
    return 'pending'


def map_roster_status(enrollment: Enrollment) -> str:
    overall = derive_overall_status(enrollment)
    if overall == 'approved':
        return 'active'
    if overall == 'rejected':
        return 'inactive'
    return 'pending'


@transaction.atomic
def create_enrollment(*, validated_data: dict) -> Enrollment:
    lrn = validated_data['lrn'].strip()
    academic_year = validated_data['academic_year']

    if Enrollment.objects.filter(lrn=lrn, academic_year=academic_year).exists():
        raise EnrollmentServiceError(
            'An enrollment application for this LRN already exists for the selected school year.',
            code='duplicate',
        )

    section = validated_data.get('section')
    if section is None:
        section, _ = Section.objects.get_or_create(
            academic_year=academic_year,
            name='Unassigned',
            defaults={'grade_level': ''},
        )

    return Enrollment.objects.create(
        lrn=lrn,
        first_name=validated_data['first_name'],
        middle_name=validated_data.get('middle_name', ''),
        last_name=validated_data['last_name'],
        academic_year=academic_year,
        section=section,
        strand=validated_data.get('strand'),
        previous_school=validated_data.get('previous_school', ''),
        grade_level_enrollment=validated_data['grade_level_enrollment'],
        grade_level_current=validated_data.get('grade_level_current', ''),
        submitted_info=validated_data.get(
            'submitted_info', 'Online admission registration form'
        ),
        birthdate=validated_data.get('birthdate'),
        age=validated_data.get('age'),
        gender=validated_data.get('gender', ''),
        address=validated_data.get('address', ''),
        contact_number=validated_data.get('contact_number', ''),
        school_name=validated_data.get('school_name', ''),
        parent_consent=validated_data.get('parent_consent', False),
    )


@transaction.atomic
def update_registrar_status(enrollment: Enrollment, status: str, *, reviewer) -> Enrollment:
    if status not in Enrollment.Status.values:
        raise EnrollmentServiceError('Invalid registrar status.')

    enrollment.registrar_status = status
    enrollment.reviewed_by_registrar = reviewer
    if status == Enrollment.Status.APPROVED and (
        not enrollment.section or enrollment.section.name == 'Unassigned'
    ):
        section, _ = Section.objects.get_or_create(
            academic_year=enrollment.academic_year,
            name='Unassigned',
            defaults={'grade_level': ''},
        )
        enrollment.section = section
    enrollment.save(
        update_fields=[
            'registrar_status',
            'reviewed_by_registrar',
            'section',
            'updated_at',
        ]
    )
    return enrollment


@transaction.atomic
def update_admin_status(enrollment: Enrollment, status: str, *, reviewer) -> Enrollment:
    if status not in Enrollment.Status.values:
        raise EnrollmentServiceError('Invalid admin status.')

    enrollment.admin_status = status
    enrollment.reviewed_by_admin = reviewer
    enrollment.save(update_fields=['admin_status', 'reviewed_by_admin', 'updated_at'])

    if status == Enrollment.Status.APPROVED:
        from apps.students.services import sync_student_from_enrollment

        sync_student_from_enrollment(enrollment)

    return enrollment


@transaction.atomic
def assign_section(enrollment: Enrollment, section: Section) -> Enrollment:
    if section.academic_year_id != enrollment.academic_year_id:
        raise EnrollmentServiceError('Section must belong to the same academic year.')
    enrollment.section = section
    enrollment.save(update_fields=['section', 'updated_at'])
    return enrollment


@transaction.atomic
def bulk_assign_sections(assignments: list[dict], *, academic_year: AcademicYear) -> int:
    updated = 0
    for row in assignments:
        enrollment_id = row.get('id')
        lrn = row.get('lrn')
        section_name = row.get('section') or 'Unassigned'

        qs = Enrollment.objects.select_for_update().filter(academic_year=academic_year)
        if enrollment_id:
            enrollment = qs.filter(pk=enrollment_id).first()
        elif lrn:
            enrollment = qs.filter(lrn=lrn).first()
        else:
            continue

        if not enrollment:
            continue

        section, _ = Section.objects.get_or_create(
            academic_year=academic_year,
            name=section_name,
            defaults={'grade_level': enrollment.grade_level_enrollment},
        )
        enrollment.section = section
        enrollment.save(update_fields=['section', 'updated_at'])
        updated += 1
    return updated


@transaction.atomic
def set_parent_consent(*, lrn: str, granted: bool, parent_name: str = '') -> Enrollment | None:
    enrollment = (
        Enrollment.objects.select_for_update()
        .filter(lrn=lrn)
        .order_by('-submitted_at')
        .first()
    )
    if not enrollment:
        return None
    enrollment.parent_consent = granted
    enrollment.parent_consent_by = parent_name if granted else ''
    enrollment.parent_consent_at = timezone.now() if granted else None
    enrollment.save(
        update_fields=[
            'parent_consent',
            'parent_consent_by',
            'parent_consent_at',
            'updated_at',
        ]
    )
    return enrollment


def get_enrollment_counts(*, academic_year: AcademicYear) -> dict:
    enrollments = Enrollment.objects.filter(academic_year=academic_year)
    overall = {'pending': 0, 'approved': 0, 'rejected': 0, 'pending_admin': 0}
    registrar = {'pending': 0, 'approved': 0, 'rejected': 0}

    for enrollment in enrollments.only(
        'registrar_status', 'admin_status'
    ):
        status = derive_overall_status(enrollment)
        if status in overall:
            overall[status] += 1
        else:
            overall['pending'] += 1

        reg = enrollment.registrar_status
        if reg in registrar:
            registrar[reg] += 1

    return {'overall': overall, 'registrar': registrar}


def get_current_academic_year() -> AcademicYear:
    current = AcademicYear.objects.filter(is_current=True).first()
    if current:
        return current
    return AcademicYear.objects.order_by('-label').first()


def set_current_academic_year(label: str) -> AcademicYear:
    year, _ = AcademicYear.objects.get_or_create(label=label)
    year.is_current = True
    year.save(update_fields=['is_current'])
    return year
