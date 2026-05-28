"""Production settings."""
import os
import logging.config

from .base import *  # noqa: F403, F401
from config.logging import LOGGING  # noqa: F401

DEBUG = False

SECURE_SSL_REDIRECT = os.environ.get('SECURE_SSL_REDIRECT', 'true').lower() in (
    'true',
    '1',
    'yes',
)
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = int(os.environ.get('SECURE_HSTS_SECONDS', '31536000'))
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

USE_SQLITE = False

# Configure logging
logging.config.dictConfig(LOGGING)

# Sentry error tracking (optional)
if os.environ.get('SENTRY_DSN'):
    try:
        import sentry_sdk
        from sentry_sdk.integrations.django import DjangoIntegration
        
        sentry_sdk.init(
            dsn=os.environ.get('SENTRY_DSN'),
            integrations=[DjangoIntegration()],
            traces_sample_rate=0.1,
            send_default_pii=False,
            environment=os.environ.get('ENVIRONMENT', 'production'),
        )
    except ImportError:
        pass  # Sentry not installed

