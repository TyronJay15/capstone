from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User


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
