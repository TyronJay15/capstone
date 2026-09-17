"""Parent login-activity helpers."""
import logging

from django.utils import timezone

from apps.authentication.services import get_client_ip, get_user_agent

from .models import ParentLoginLog, ParentProfile

logger = logging.getLogger(__name__)


def record_parent_login(user, request=None):
    """Record a successful parent sign-in.

    Never raises: a logging failure must not break a valid sign-in.
    """
    try:
        return ParentLoginLog.objects.create(
            parent=ParentProfile.objects.filter(user=user).first(),
            user=user,
            ip_address=get_client_ip(request),
            user_agent=get_user_agent(request),
        )
    except Exception:  # pragma: no cover - defensive only
        logger.exception('Failed to record parent login')
        return None


def close_parent_login_session(user):
    """Stamp ``logout_time`` on the parent's most recent open session."""
    try:
        log = ParentLoginLog.objects.filter(user=user, logout_time__isnull=True).first()
        if not log:
            return None
        log.logout_time = timezone.now()
        log.save(update_fields=['logout_time'])
        return log
    except Exception:  # pragma: no cover - defensive only
        logger.exception('Failed to close parent login session')
        return None
