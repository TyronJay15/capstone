"""Audit trail recording helpers."""
from .models import AuditTrail


def record_audit(user, module, action, metadata=None):
    """Persist an audit trail entry.

    Safe to call inside request handlers; never raises on a bad user object.
    """
    actor_label = ''
    user_fk = None
    if user is not None and getattr(user, 'is_authenticated', False):
        user_fk = user
        actor_label = (user.get_full_name() or user.email) if hasattr(user, 'email') else str(user)

    return AuditTrail.objects.create(
        user=user_fk,
        actor_label=actor_label,
        module=module,
        action=action,
        metadata=metadata or {},
    )
