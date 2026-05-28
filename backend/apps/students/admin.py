from django.contrib import admin

from .models import ParentStudentLink, StudentProfile


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

