from django.contrib import admin

from .models import ParentLoginLog, ParentProfile


@admin.register(ParentProfile)
class ParentProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'user_email', 'phone_number', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('user__email', 'user__first_name', 'user__last_name', 'phone_number')
    readonly_fields = ('created_at', 'updated_at')

    def user_email(self, obj):
        return obj.user.email if obj.user else '—'

    user_email.short_description = 'Email'


@admin.register(ParentLoginLog)
class ParentLoginLogAdmin(admin.ModelAdmin):
    list_display = ('login_time', 'user', 'parent', 'ip_address', 'logout_time')
    list_filter = ('login_time',)
    search_fields = ('user__email', 'user__first_name', 'user__last_name', 'ip_address')
    readonly_fields = (
        'parent',
        'user',
        'ip_address',
        'user_agent',
        'login_time',
        'logout_time',
    )
