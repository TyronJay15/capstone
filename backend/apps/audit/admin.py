from django.contrib import admin

from .models import AuditTrail


@admin.register(AuditTrail)
class AuditTrailAdmin(admin.ModelAdmin):
    list_display = ('created_at', 'module', 'action', 'actor_label')
    list_filter = ('module', 'created_at')
    search_fields = ('action', 'actor_label')
    readonly_fields = ('created_at',)
