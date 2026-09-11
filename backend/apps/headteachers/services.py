"""Head Teacher orchestration: assignments, sectioning, summaries.

Reuses existing models (enrollment.Section, teachers.TeacherAssignment) rather
than duplicating them, and records every action to the audit trail.
"""
from django.contrib.auth import get_user_model
from django.db import transaction

from apps.audit.models import AuditTrail
from apps.audit.services import record_audit
from apps.enrollment.models import AcademicYear, Section, Strand
from apps.enrollment.services import get_current_academic_year
from apps.students.models import StudentProfile
from apps.teachers.models import TeacherAssignment
from shared.permissions.roles import Role

from .models import AdviserAssignment

User = get_user_model()


class HeadTeacherError(Exception):
    def __init__(self, message, code='headteacher_error'):
        self.message = message
        self.code = code
        super().__init__(message)


def get_teacher_directory(academic_year=None):
    """Alphabetical staff list with current assignment + availability."""
    year = academic_year or get_current_academic_year()
    staff = User.objects.filter(
        role__in=(Role.TEACHER, Role.ADVISER, Role.HEAD_TEACHER), is_active=True
    ).order_by('last_name', 'first_name')

    directory = []
    for user in staff:
        adviser_sections = list(
            AdviserAssignment.objects.filter(adviser=user)
            .select_related('section')
            .values_list('section__name', flat=True)
        )
        subject_assignments = list(
            TeacherAssignment.objects.filter(teacher=user)
            .select_related('subject', 'section')
            .values_list('subject__name', 'section__name')
        )
        assignment_labels = adviser_sections + [
            f'{subj} ({sec or "All"})' for subj, sec in subject_assignments
        ]
        directory.append(
            {
                'id': user.id,
                'name': user.get_full_name() or user.email,
                'email': user.email,
                'role': user.role,
                'current_assignment': ', '.join(assignment_labels) or 'None',
                'available': len(assignment_labels) == 0,
            }
        )
    return directory


@transaction.atomic
def assign_adviser(*, adviser_id, section_id, by_user):
    adviser = User.objects.filter(id=adviser_id, is_active=True).first()
    if not adviser:
        raise HeadTeacherError('Adviser account not found.', code='adviser_not_found')
    section = Section.objects.select_related('academic_year').filter(id=section_id).first()
    if not section:
        raise HeadTeacherError('Section not found.', code='section_not_found')

    assignment, _ = AdviserAssignment.objects.update_or_create(
        section=section,
        defaults={
            'adviser': adviser,
            'academic_year': section.academic_year,
            'assigned_by': by_user if getattr(by_user, 'is_authenticated', False) else None,
        },
    )
    record_audit(
        by_user,
        AuditTrail.Module.ADVISER_ASSIGNMENT,
        f'Assigned {adviser.get_full_name() or adviser.email} as adviser of {section.name}',
        metadata={'section': section.name, 'adviser_id': adviser.id},
    )
    return assignment


@transaction.atomic
def assign_subject_teacher(*, teacher_id, subject_id, section_id=None, grade_level='', by_user):
    from apps.academics.models import Subject

    teacher = User.objects.filter(id=teacher_id, is_active=True).first()
    if not teacher:
        raise HeadTeacherError('Teacher account not found.', code='teacher_not_found')
    subject = Subject.objects.filter(id=subject_id).first()
    if not subject:
        raise HeadTeacherError('Subject not found.', code='subject_not_found')

    section = None
    if section_id:
        section = Section.objects.select_related('academic_year').filter(id=section_id).first()
        if not section:
            raise HeadTeacherError('Section not found.', code='section_not_found')

    year = section.academic_year if section else get_current_academic_year()
    if not year:
        raise HeadTeacherError('No active academic year.', code='no_academic_year')

    assignment, _ = TeacherAssignment.objects.get_or_create(
        teacher=teacher,
        subject=subject,
        academic_year=year,
        grade_level=grade_level or (section.grade_level if section else ''),
        section=section,
    )
    record_audit(
        by_user,
        AuditTrail.Module.TEACHER_ASSIGNMENT,
        f'Assigned {teacher.get_full_name() or teacher.email} to {subject.name}'
        + (f' ({section.name})' if section else ''),
        metadata={'teacher_id': teacher.id, 'subject': subject.name,
                  'section': section.name if section else None},
    )
    return assignment


@transaction.atomic
def create_section(*, name, grade_level='', strand_code='', academic_year=None, by_user):
    year = academic_year or get_current_academic_year()
    if not year:
        raise HeadTeacherError('No active academic year.', code='no_academic_year')
    name = (name or '').strip()
    if not name:
        raise HeadTeacherError('Section name is required.', code='name_required')
    if Section.objects.filter(academic_year=year, name=name).exists():
        raise HeadTeacherError('A section with this name already exists.', code='duplicate_section')

    strand = None
    if strand_code:
        strand = Strand.objects.filter(code=strand_code).first()

    section = Section.objects.create(
        academic_year=year, name=name, grade_level=grade_level, strand=strand
    )
    record_audit(
        by_user,
        AuditTrail.Module.SECTION_CREATION,
        f'Created section {section.name}',
        metadata={'section': section.name, 'strand': strand.name if strand else None},
    )
    return section


def build_section_summary(academic_year=None):
    """Section → {name, strand, school year, adviser, subject teachers, students}."""
    year = academic_year or get_current_academic_year()
    sections = (
        Section.objects.filter(academic_year=year)
        .select_related('strand', 'academic_year', 'adviser_assignment__adviser')
        .order_by('name')
    )

    summary = []
    for section in sections:
        students = list(
            StudentProfile.objects.filter(section=section, is_active=True)
            .order_by('last_name', 'first_name')
            .values_list('lrn', 'first_name', 'last_name')
        )
        subject_teachers = list(
            TeacherAssignment.objects.filter(section=section)
            .select_related('teacher', 'subject')
            .values_list('teacher__first_name', 'teacher__last_name', 'subject__name')
        )
        adviser_assignment = getattr(section, 'adviser_assignment', None)
        adviser_name = ''
        if adviser_assignment and adviser_assignment.adviser:
            adviser = adviser_assignment.adviser
            adviser_name = adviser.get_full_name() or adviser.email

        summary.append(
            {
                'id': section.id,
                'name': section.name,
                'grade_level': section.grade_level,
                'strand': section.strand.name if section.strand else '',
                'school_year': section.academic_year.label,
                'adviser': adviser_name,
                'subject_teachers': [
                    {'name': f'{fn} {ln}'.strip(), 'subject': subj}
                    for fn, ln, subj in subject_teachers
                ],
                'total_students': len(students),
                'students': [
                    {'lrn': lrn, 'name': f'{fn} {ln}'.strip()} for lrn, fn, ln in students
                ],
            }
        )
    return summary
