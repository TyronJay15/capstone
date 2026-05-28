from django.contrib import admin, messages

from apps.authentication.models import User
from apps.students.models import StudentProfile

from .models import AcademicYear, Enrollment, Section, Strand


@admin.register(AcademicYear)
class AcademicYearAdmin(admin.ModelAdmin):
    list_display = ('label', 'is_current', 'starts_on', 'ends_on')
    list_filter = ('is_current',)


@admin.register(Section)
class SectionAdmin(admin.ModelAdmin):
    list_display = ('name', 'academic_year', 'grade_level')
    list_filter = ('academic_year',)


@admin.register(Strand)
class StrandAdmin(admin.ModelAdmin):
    list_display = ('code', 'name')


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = (
        'lrn',
        'full_name',
        'academic_year',
        'grade_level_enrollment',
        'registrar_status',
        'admin_status',
        'section',
    )
    list_filter = ('academic_year', 'registrar_status', 'admin_status', 'section')
    search_fields = ('lrn', 'first_name', 'last_name')
    readonly_fields = ('submitted_at', 'created_at', 'updated_at')
    actions = ['approve_by_registrar', 'approve_by_admin', 'reject_by_registrar', 'reject_by_admin']

    def approve_by_registrar(self, request, queryset):
        """Approve enrollment by registrar and create StudentProfile + User."""
        count = 0
        for enrollment in queryset.filter(registrar_status=Enrollment.Status.PENDING):
            # Create or get User account
            email = enrollment.first_name.lower().replace(' ', '') + '.' + enrollment.last_name.lower().replace(' ', '') + '@student.gradeportal.local'
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'first_name': enrollment.first_name,
                    'last_name': enrollment.last_name,
                    'is_active': True,
                    'role': 'student',
                }
            )

            # Create StudentProfile if doesn't exist
            student_profile, _ = StudentProfile.objects.get_or_create(
                lrn=enrollment.lrn,
                defaults={
                    'user': user,
                    'enrollment': enrollment,
                    'first_name': enrollment.first_name,
                    'middle_name': enrollment.middle_name,
                    'last_name': enrollment.last_name,
                    'email': email,
                    'grade_level': enrollment.grade_level_enrollment,
                    'section': enrollment.section,
                    'academic_year': enrollment.academic_year,
                    'is_active': True,
                }
            )

            # Update enrollment status
            enrollment.registrar_status = Enrollment.Status.APPROVED
            enrollment.reviewed_by_registrar = request.user
            enrollment.save()
            count += 1

        self.message_user(
            request,
            f'{count} enrollment(s) approved by registrar. Student accounts created.',
            messages.SUCCESS
        )

    approve_by_registrar.short_description = 'Approve by Registrar (creates student account)'

    def approve_by_admin(self, request, queryset):
        """Approve enrollment by admin."""
        count = 0
        for enrollment in queryset.filter(admin_status=Enrollment.Status.PENDING):
            enrollment.admin_status = Enrollment.Status.APPROVED
            enrollment.reviewed_by_admin = request.user
            enrollment.save()
            count += 1

        self.message_user(
            request,
            f'{count} enrollment(s) approved by admin.',
            messages.SUCCESS
        )

    approve_by_admin.short_description = 'Approve by Admin'

    def reject_by_registrar(self, request, queryset):
        """Reject enrollment by registrar."""
        count = queryset.filter(registrar_status=Enrollment.Status.PENDING).update(
            registrar_status=Enrollment.Status.REJECTED,
            reviewed_by_registrar=request.user
        )
        self.message_user(
            request,
            f'{count} enrollment(s) rejected by registrar.',
            messages.WARNING
        )

    reject_by_registrar.short_description = 'Reject by Registrar'

    def reject_by_admin(self, request, queryset):
        """Reject enrollment by admin."""
        count = queryset.filter(admin_status=Enrollment.Status.PENDING).update(
            admin_status=Enrollment.Status.REJECTED,
            reviewed_by_admin=request.user
        )
        self.message_user(
            request,
            f'{count} enrollment(s) rejected by admin.',
            messages.WARNING
        )

    reject_by_admin.short_description = 'Reject by Admin'
