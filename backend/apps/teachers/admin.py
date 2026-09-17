from django.contrib import admin

from .models import TeacherAssignment, TeacherLoginLog


@admin.register(TeacherAssignment)
class TeacherAssignmentAdmin(admin.ModelAdmin):
    list_display = ('teacher', 'subject', 'academic_year', 'grade_level', 'section')
    list_filter = ('academic_year', 'subject')


@admin.register(TeacherLoginLog)
class TeacherLoginLogAdmin(admin.ModelAdmin):
    list_display = ('login_time', 'user', 'ip_address', 'logout_time')
    list_filter = ('login_time',)
    search_fields = ('user__email', 'user__first_name', 'user__last_name', 'ip_address')
    readonly_fields = ('user', 'ip_address', 'user_agent', 'login_time', 'logout_time')
