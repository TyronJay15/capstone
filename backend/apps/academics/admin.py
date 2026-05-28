from django.contrib import admin

from .models import GradeRecord, Semester, Subject


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'is_active')


@admin.register(Semester)
class SemesterAdmin(admin.ModelAdmin):
    list_display = ('label', 'academic_year', 'code', 'is_current')


@admin.register(GradeRecord)
class GradeRecordAdmin(admin.ModelAdmin):
    list_display = ('student', 'subject', 'semester', 'score')
    list_filter = ('semester', 'subject')
