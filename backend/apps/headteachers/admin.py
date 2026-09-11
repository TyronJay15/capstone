from django.contrib import admin

from .models import AdviserAssignment


@admin.register(AdviserAssignment)
class AdviserAssignmentAdmin(admin.ModelAdmin):
    list_display = ('section', 'adviser', 'academic_year', 'assigned_at')
    list_filter = ('academic_year',)
    search_fields = ('section__name', 'adviser__email')
