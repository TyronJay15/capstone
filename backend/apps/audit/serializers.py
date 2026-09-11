from rest_framework import serializers

from .models import AuditTrail


class AuditTrailSerializer(serializers.ModelSerializer):
    module_label = serializers.CharField(source='get_module_display', read_only=True)
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = AuditTrail
        fields = (
            'id',
            'module',
            'module_label',
            'action',
            'user',
            'user_name',
            'actor_label',
            'metadata',
            'created_at',
        )
        read_only_fields = fields

    def get_user_name(self, obj):
        if obj.user:
            return obj.user.get_full_name() or obj.user.email
        return obj.actor_label or 'System'
