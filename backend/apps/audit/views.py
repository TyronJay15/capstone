from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated

from shared.permissions.roles import Role, role_permission_class

from .models import AuditTrail
from .serializers import AuditTrailSerializer

IsAuditViewer = role_permission_class(Role.HEAD_TEACHER, Role.ADMIN)


class AuditTrailListView(ListAPIView):
    """GET /api/v1/audit/ — paginated audit trail for head teacher / admin.

    Supports ?module=<choice>, ?search=, and standard pagination.
    """

    serializer_class = AuditTrailSerializer
    permission_classes = [IsAuthenticated, IsAuditViewer]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['module']
    search_fields = ['action', 'actor_label']

    def get_queryset(self):
        return AuditTrail.objects.select_related('user').all()
