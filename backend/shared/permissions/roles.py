"""Central role definitions aligned with the React frontend."""
from rest_framework.permissions import BasePermission


class Role:
    STUDENT = 'student'
    PARENT = 'parent'
    TEACHER = 'teacher'
    REGISTRAR = 'registrar'
    ADMIN = 'admin'

    ALL = (STUDENT, PARENT, TEACHER, REGISTRAR, ADMIN)
    STAFF = (TEACHER, REGISTRAR, ADMIN)


def role_permission_class(*allowed_roles):
    """Factory for DRF permission classes restricted to given roles."""

    class RolePermission(BasePermission):
        def has_permission(self, request, view):
            user = request.user
            if not user or not user.is_authenticated:
                return False
            if getattr(user, 'is_superuser', False):
                return True
            return getattr(user, 'role', None) in allowed_roles

    RolePermission.__name__ = f"RolePermission_{'_'.join(allowed_roles)}"
    return RolePermission
