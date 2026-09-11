from django.contrib import admin

from .models import GradeRecord, Subject, Term


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'is_active')


@admin.register(Term)
class TermAdmin(admin.ModelAdmin):
    list_display = ('label', 'academic_year', 'code', 'is_current')


@admin.register(GradeRecord)
class GradeRecordAdmin(admin.ModelAdmin):
    list_display = ('student', 'subject', 'term', 'score')
    list_filter = ('term', 'subject')
