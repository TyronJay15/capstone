"""Authentication business logic."""
import logging

import requests
from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import validate_ipv46_address

logger = logging.getLogger(__name__)

RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify'

# Anything longer is truncated before storage — a client controls this header,
# so it is never trusted to be a sane length.
USER_AGENT_MAX_LENGTH = 512


def get_client_ip(request):
    """Best-effort client IP, honouring a proxy's X-Forwarded-For header.

    The header is client-controlled and can be spoofed or malformed, so the
    result is validated and discarded (``None``) if it is not a real IPv4/IPv6
    address. That keeps a junk header from failing the INSERT on a strict
    backend such as MySQL and taking the whole sign-in down with it.
    """
    if not request:
        return None

    forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    candidate = forwarded.split(',')[0].strip() if forwarded else request.META.get('REMOTE_ADDR')
    if not candidate:
        return None

    try:
        validate_ipv46_address(candidate)
    except ValidationError:
        logger.warning('Discarded malformed client IP address')
        return None
    return candidate


def get_user_agent(request):
    """Client user-agent string, truncated to a storable length."""
    if not request:
        return ''
    return (request.META.get('HTTP_USER_AGENT', '') or '')[:USER_AGENT_MAX_LENGTH]


def record_login(user, request=None, *, student_lrn=''):
    """Persist a successful login for the admin login-activity view.

    Never raises: a logging failure must not break a valid sign-in.
    """
    from .models import LoginActivity

    try:
        return LoginActivity.objects.create(
            user=user,
            role=getattr(user, 'role', '') or '',
            email=getattr(user, 'email', '') or '',
            full_name=user.get_full_name() if hasattr(user, 'get_full_name') else '',
            student_lrn=student_lrn or getattr(user, 'student_lrn', '') or '',
            ip_address=get_client_ip(request),
            user_agent=get_user_agent(request),
        )
    except Exception:  # pragma: no cover - defensive only
        logger.exception('Failed to record login activity')
        return None


def verify_recaptcha_token(token: str) -> dict:
    """
    Verify a reCAPTCHA token with Google siteverify API.
    Returns dict with keys: success (bool), error (str|None), codes (list).
    """
    secret = settings.RECAPTCHA_SECRET_KEY
    if not secret:
        return {
            'success': False,
            'error': 'reCAPTCHA secret key is not configured on the server.',
            'codes': [],
        }

    if not token:
        return {
            'success': False,
            'error': 'Missing reCAPTCHA token.',
            'codes': [],
        }

    try:
        response = requests.post(
            RECAPTCHA_VERIFY_URL,
            data={'secret': secret, 'response': token},
            timeout=10,
        )
        response.raise_for_status()
        data = response.json()
    except requests.RequestException as exc:
        logger.exception('reCAPTCHA verification request failed')
        return {
            'success': False,
            'error': 'Server error during reCAPTCHA verification.',
            'codes': [],
            'detail': str(exc),
        }

    if not data.get('success'):
        return {
            'success': False,
            'error': 'reCAPTCHA validation failed.',
            'codes': data.get('error-codes', []),
        }

    return {'success': True, 'error': None, 'codes': []}
