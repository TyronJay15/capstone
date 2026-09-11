"""Central role definitions aligned with the React frontend."""
from rest_framework.permissions import BasePermission


class Role:
    STUDENT = 'student'
    PARENT = 'parent'
    TEACHER = 'teacher'
    ADVISER = 'adviser'
    HEAD_TEACHER = 'head_teacher'
    REGISTRAR = 'registrar'
    ADMIN = 'admin'

    ALL = (STUDENT, PARENT, TEACHER, ADVISER, HEAD_TEACHER, REGISTRAR, ADMIN)
    # Roles that teach / encode grades / advise sections.
    ACADEMIC = (TEACHER, ADVISER, HEAD_TEACHER)
    # All non-student, non-parent staff.
    STAFF = (TEACHER, ADVISER, HEAD_TEACHER, REGISTRAR, ADMIN)


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
