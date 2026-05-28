"""Authentication business logic."""
import logging

import requests
from django.conf import settings

logger = logging.getLogger(__name__)

RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify'


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
