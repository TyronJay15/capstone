from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import LoginActivity, User


@admin.register(User)
class GradePortalUserAdmin(UserAdmin):
    list_display = ('email', 'role', 'first_name', 'last_name', 'is_active')
    list_filter = ('role', 'is_active', 'is_staff')
    search_fields = ('email', 'first_name', 'last_name', 'student_lrn')
    ordering = ('email',)

    fieldsets = UserAdmin.fieldsets + (
        ('Grade Portal', {'fields': ('role', 'student_lrn')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Grade Portal', {'fields': ('role', 'student_lrn')}),
    )


@admin.register(LoginActivity)
class LoginActivityAdmin(admin.ModelAdmin):
    list_display = ('logged_in_at', 'full_name', 'email', 'role', 'student_lrn', 'ip_address')
    list_filter = ('role', 'logged_in_at')
    search_fields = ('email', 'full_name', 'student_lrn')
    readonly_fields = (
        'user',
        'role',
        'email',
        'full_name',
        'student_lrn',
        'ip_address',
        'user_agent',
        'logged_in_at',
    )
