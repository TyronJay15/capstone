"""Development settings."""
from .base import *  # noqa: F403, F401

DEBUG = True

REST_FRAMEWORK['DEFAULT_THROTTLE_RATES'] = {  # noqa: F405
    'anon': '200/hour',
    'user': '2000/hour',
}
