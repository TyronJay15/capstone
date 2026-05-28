# Gunicorn configuration for Grade Portal Django production server
# Usage: gunicorn -c gunicorn_config.py config.wsgi:application

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

# Server socket
bind = os.environ.get('GUNICORN_BIND', '0.0.0.0:8000')
backlog = 2048

# Worker processes
workers = int(os.environ.get('GUNICORN_WORKERS', '4'))
worker_class = 'sync'  # Use 'gevent' for async, 'sync' for threaded
worker_connections = 1000
timeout = int(os.environ.get('GUNICORN_TIMEOUT', '30'))
keepalive = 2

# Logging
accesslog = os.environ.get('GUNICORN_ACCESS_LOG', '/var/log/gunicorn/access.log')
errorlog = os.environ.get('GUNICORN_ERROR_LOG', '/var/log/gunicorn/error.log')
loglevel = os.environ.get('GUNICORN_LOG_LEVEL', 'info')
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Process naming
proc_name = 'gradeportal'

# Server mechanics
daemon = False
pidfile = '/var/run/gunicorn.pid'
umask = 0o022
user = None
group = None

# Application
python_path = str(BASE_DIR)
raw_env = [f'DJANGO_SETTINGS_MODULE=config.settings.production']

# SSL (if needed - can be set via reverse proxy)
# keyfile = '/path/to/keyfile'
# certfile = '/path/to/certfile'
# ca_certs = '/path/to/ca_certs'

# Server hooks
def on_starting(server):
    """Called just before the master process is initialized."""
    import logging
    logger = logging.getLogger('gunicorn.startup')
    logger.info('⚙️  Gunicorn server is starting...')

def when_ready(server):
    """Called just after the server is started."""
    import logging
    logger = logging.getLogger('gunicorn.startup')
    logger.info('✅ Gunicorn server is ready. Spawning workers')

def on_exit(server):
    """Called just before exiting Gunicorn."""
    import logging
    logger = logging.getLogger('gunicorn.shutdown')
    logger.info('👋 Gunicorn server is shutting down.')

# Reload behavior
reload = os.environ.get('GUNICORN_RELOAD', 'False').lower() == 'true'
reload_extra_files = []

# Production optimizations
preload_app = False  # Set to True if using threads
max_requests = int(os.environ.get('GUNICORN_MAX_REQUESTS', '1000'))
max_requests_jitter = int(os.environ.get('GUNICORN_MAX_REQUESTS_JITTER', '50'))
