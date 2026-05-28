from django.contrib import admin

from .models import TeacherAssignment


@admin.register(TeacherAssignment)
class TeacherAssignmentAdmin(admin.ModelAdmin):
    list_display = ('teacher', 'subject', 'academic_year', 'grade_level', 'section')
    list_filter = ('academic_year', 'subject')
