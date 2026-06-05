from django.contrib import admin

from .models import ParentStudentLink, StudentProfile, StudentLoginLog


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ('lrn', 'full_name', 'user_email', 'grade_level', 'section', 'academic_year', 'is_active')
    list_filter = ('academic_year', 'section', 'is_active')
    search_fields = ('lrn', 'first_name', 'last_name', 'email', 'user__email')
    readonly_fields = ('created_at', 'updated_at')
    
    def user_email(self, obj):
        return obj.user.email if obj.user else '—'
    user_email.short_description = 'User Email'


@admin.register(ParentStudentLink)
class ParentStudentLinkAdmin(admin.ModelAdmin):
    list_display = ('parent', 'student', 'relationship')


@admin.register(StudentLoginLog)
class StudentLoginLogAdmin(admin.ModelAdmin):
    list_display = ('student', 'user_email', 'login_time', 'ip_address', 'session_duration')
    list_filter = ('login_time', 'student__academic_year')
    search_fields = ('student__lrn', 'user__email', 'ip_address')
    readonly_fields = ('login_time', 'session_duration')
    ordering = ['-login_time']

    def user_email(self, obj):
        return obj.user.email if obj.user else '—'

    user_email.short_description = 'User Email'

    def session_duration(self, obj):
        if obj.session_duration:
            hours, remainder = divmod(int(obj.session_duration), 3600)
            minutes, seconds = divmod(remainder, 60)
            return f'{hours}h {minutes}m {seconds}s'
        return '—'

    session_duration.short_description = 'Session Duration'
