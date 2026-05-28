#!/usr/bin/env python
"""
Production Readiness Validator for Grade Portal Phase 3b
Validates all production deployment requirements before launch.
"""

import os
import sys
import json
import subprocess
from pathlib import Path
from typing import List, Tuple, Dict, Any

# Color codes for terminal output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'
BOLD = '\033[1m'


class ProductionValidator:
    """Validates Grade Portal production readiness."""
    
    def __init__(self, workspace_root: str = None):
        """Initialize validator with workspace root."""
        if workspace_root is None:
            workspace_root = Path(__file__).parent
        self.workspace_root = Path(workspace_root)
        self.backend_root = self.workspace_root / 'backend'
        self.frontend_root = self.workspace_root / 'frontend'
        self.checks_passed = 0
        self.checks_failed = 0
        self.checks_warned = 0
        self.results: List[Dict[str, Any]] = []
    
    def _print(self, status: str, message: str, details: str = None):
        """Print formatted output."""
        color = {
            'PASS': GREEN,
            'FAIL': RED,
            'WARN': YELLOW,
            'INFO': BLUE,
        }.get(status, RESET)
        
        symbol = {
            'PASS': '✓',
            'FAIL': '✗',
            'WARN': '⚠',
            'INFO': 'ℹ',
        }.get(status, ' ')
        
        print(f"{color}{BOLD}{symbol}{RESET} {color}{status:5}{RESET} | {message}")
        if details:
            print(f"         {details}")
    
    def _check_file_exists(self, path: Path, description: str) -> bool:
        """Check if file exists."""
        if path.exists():
            self._print('PASS', f"{description}: {path.relative_to(self.workspace_root)}")
            self.checks_passed += 1
            return True
        else:
            self._print('FAIL', f"{description} missing: {path.relative_to(self.workspace_root)}")
            self.checks_failed += 1
            return False
    
    def _check_file_contains(self, path: Path, content: str, description: str) -> bool:
        """Check if file contains specific content."""
        if not path.exists():
            self._print('FAIL', f"{description} (file not found)")
            self.checks_failed += 1
            return False
        
        try:
            file_content = path.read_text()
            if content in file_content:
                self._print('PASS', description)
                self.checks_passed += 1
                return True
            else:
                self._print('FAIL', description)
                self.checks_failed += 1
                return False
        except Exception as e:
            self._print('FAIL', description, str(e))
            self.checks_failed += 1
            return False
    
    def _check_env_setting(self, env_file: Path, key: str, 
                          expected: str = None, description: str = None) -> bool:
        """Check environment variable setting."""
        if description is None:
            description = f"Environment variable: {key}"
        
        if not env_file.exists():
            self._print('WARN', description, f"Environment file not found: {env_file}")
            self.checks_warned += 1
            return False
        
        try:
            env_content = env_file.read_text()
            lines = [l for l in env_content.split('\n') if key in l]
            
            if not lines:
                self._print('FAIL', description, "Variable not set")
                self.checks_failed += 1
                return False
            
            if expected and expected not in lines[0]:
                self._print('WARN', description, f"May need review: {lines[0]}")
                self.checks_warned += 1
                return False
            
            self._print('PASS', description)
            self.checks_passed += 1
            return True
        except Exception as e:
            self._print('FAIL', description, str(e))
            self.checks_failed += 1
            return False
    
    def validate_backend_structure(self):
        """Validate backend directory structure."""
        print(f"\n{BOLD}{BLUE}=== Backend Structure ==={RESET}")
        
        required_files = {
            'requirements.txt': 'Backend dependencies',
            'manage.py': 'Django management script',
            'gunicorn_config.py': 'Gunicorn WSGI server config',
            'config/settings/production.py': 'Production settings module',
            'config/logging.py': 'Logging configuration',
        }
        
        for file, desc in required_files.items():
            self._check_file_exists(self.backend_root / file, desc)
        
        # Check for development files that shouldn't be in production
        dev_files = ['db.sqlite3', 'local_settings.py']
        for file in dev_files:
            path = self.backend_root / file
            if path.exists():
                self._print('WARN', f"Development file present: {file}")
                self.checks_warned += 1
    
    def validate_frontend_structure(self):
        """Validate frontend directory structure."""
        print(f"\n{BOLD}{BLUE}=== Frontend Structure ==={RESET}")
        
        required_files = {
            'package.json': 'Node dependencies',
            'postcss.config.js': 'PostCSS config',
            'tailwind.config.js': 'Tailwind CSS config',
        }
        
        for file, desc in required_files.items():
            self._check_file_exists(self.frontend_root / file, desc)
    
    def validate_docker_setup(self):
        """Validate Docker configuration."""
        print(f"\n{BOLD}{BLUE}=== Docker Setup ==={RESET}")
        
        files = {
            'docker-compose.yml': 'Docker Compose config',
            'backend/Dockerfile': 'Backend Dockerfile',
            'nginx/gradeportal.conf': 'Nginx configuration',
        }
        
        for file, desc in files.items():
            self._check_file_exists(self.workspace_root / file, desc)
        
        # Check Docker Compose has production config
        compose_file = self.workspace_root / 'docker-compose.yml'
        self._check_file_contains(compose_file, 'gunicorn', 
                                 'Docker Compose uses Gunicorn')
        self._check_file_contains(compose_file, 'DJANGO_SETTINGS_MODULE',
                                 'Docker Compose has DJANGO_SETTINGS_MODULE')
        self._check_file_contains(compose_file, 'healthcheck',
                                 'Docker Compose has health checks')
    
    def validate_environment_files(self):
        """Validate environment configuration."""
        print(f"\n{BOLD}{BLUE}=== Environment Configuration ==={RESET}")
        
        backend_env = self.backend_root / '.env.example'
        frontend_env = self.frontend_root / '.env.example'
        
        self._check_file_exists(backend_env, 'Backend .env.example')
        self._check_file_exists(frontend_env, 'Frontend .env.example')
        
        # Check backend environment variables
        if backend_env.exists():
            print("\n  Backend environment variables:")
            required_backend_vars = [
                ('DJANGO_SETTINGS_MODULE', 'config.settings.production', 
                 'Django settings module set to production'),
                ('DEBUG', 'False', 'DEBUG mode disabled'),
                ('SECRET_KEY', None, 'SECRET_KEY configured'),
                ('ALLOWED_HOSTS', None, 'ALLOWED_HOSTS restricted'),
                ('CORS_ALLOWED_ORIGINS', None, 'CORS restricted'),
            ]
            
            for var, expected, desc in required_backend_vars:
                self._check_env_setting(backend_env, var, expected, desc)
        
        # Check frontend environment variables
        if frontend_env.exists():
            print("\n  Frontend environment variables:")
            self._check_env_setting(frontend_env, 'REACT_APP_USE_API_ONLY',
                                   'true', 'API-only mode enabled for production')
            self._check_env_setting(frontend_env, 'REACT_APP_API_BASE_URL',
                                   None, 'API base URL configured')
    
    def validate_security_configuration(self):
        """Validate security settings."""
        print(f"\n{BOLD}{BLUE}=== Security Configuration ==={RESET}")
        
        # Check production settings
        prod_settings = self.backend_root / 'config/settings/production.py'
        if prod_settings.exists():
            checks = [
                ('SECURE_SSL_REDIRECT', 'SSL redirect enabled'),
                ('SESSION_COOKIE_SECURE', 'Session cookies secure'),
                ('CSRF_COOKIE_SECURE', 'CSRF cookies secure'),
                ('SECURE_HSTS_SECONDS', 'HSTS enabled'),
                ('SecurityHeadersMiddleware', 'Security headers middleware'),
            ]
            
            for pattern, desc in checks:
                self._check_file_contains(prod_settings, pattern, f"Production: {desc}")
        
        # Check nginx security headers
        nginx_conf = self.workspace_root / 'nginx/gradeportal.conf'
        if nginx_conf.exists():
            headers = [
                ('X-Frame-Options', 'X-Frame-Options header'),
                ('X-Content-Type-Options', 'X-Content-Type-Options header'),
                ('Strict-Transport-Security', 'HSTS header'),
                ('Content-Security-Policy', 'CSP header'),
            ]
            
            for header, desc in headers:
                self._check_file_contains(nginx_conf, header, f"Nginx: {desc}")
    
    def validate_database_setup(self):
        """Validate database configuration."""
        print(f"\n{BOLD}{BLUE}=== Database Configuration ==={RESET}")
        
        # Check production settings use MySQL
        prod_settings = self.backend_root / 'config/settings/production.py'
        self._check_file_contains(prod_settings, 'USE_SQLITE = False',
                                 'Production uses MySQL (not SQLite)')
        
        # Check database scripts exist
        backup_script = self.backend_root / 'scripts/backup_database.sh'
        restore_script = self.backend_root / 'scripts/restore_database.sh'
        
        self._check_file_exists(backup_script, 'Database backup script')
        self._check_file_exists(restore_script, 'Database restore script')
    
    def validate_api_persistence(self):
        """Validate API-only persistence."""
        print(f"\n{BOLD}{BLUE}=== API Persistence Configuration ==={RESET}")
        
        # Check enrollmentStore enforces API-only
        store_file = self.frontend_root / 'src/services/enrollmentStore.js'
        self._check_file_contains(store_file, 'REACT_APP_USE_API_ONLY',
                                 'Frontend: API-only mode check')
        self._check_file_contains(store_file, 'throw',
                                 'Frontend: Errors thrown on API failure')
        
        # Check backend has profile update endpoint
        student_views = self.backend_root / 'apps/students/views.py'
        self._check_file_contains(student_views, '@action',
                                 'Backend: Student profile endpoint')
        
        # Check JWT refresh logic
        api_client = self.frontend_root / 'src/services/apiClient.js'
        self._check_file_contains(api_client, 'refreshAccessToken',
                                 'Frontend: JWT refresh logic')
    
    def validate_deployment_docs(self):
        """Validate deployment documentation."""
        print(f"\n{BOLD}{BLUE}=== Deployment Documentation ==={RESET}")
        
        docs = {
            'DEPLOYMENT_GUIDE.md': 'Main deployment guide',
            'DEPLOYMENT_PLATFORMS.md': 'Platform-specific guides',
            'TESTING_AND_LAUNCH.md': 'Testing procedures',
            'backend/.env.example': 'Backend environment documentation',
            'frontend/.env.example': 'Frontend environment documentation',
        }
        
        for file, desc in docs.items():
            self._check_file_exists(self.workspace_root / file, desc)
    
    def validate_logging_setup(self):
        """Validate logging configuration."""
        print(f"\n{BOLD}{BLUE}=== Logging Configuration ==={RESET}")
        
        logging_config = self.backend_root / 'config/logging.py'
        self._check_file_exists(logging_config, 'Logging configuration')
        
        if logging_config.exists():
            checks = [
                ('RotatingFileHandler', 'File logging with rotation'),
                ('ERROR', 'Error-level logging'),
                ('audit', 'Audit logging'),
                ('security', 'Security logging'),
            ]
            
            for pattern, desc in checks:
                self._check_file_contains(logging_config, pattern, f"Logging: {desc}")
    
    def validate_gunicorn_config(self):
        """Validate Gunicorn configuration."""
        print(f"\n{BOLD}{BLUE}=== Gunicorn Configuration ==={RESET}")
        
        gunicorn_file = self.backend_root / 'gunicorn_config.py'
        self._check_file_exists(gunicorn_file, 'Gunicorn configuration')
        
        if gunicorn_file.exists():
            checks = [
                ('workers = ', 'Worker configuration'),
                ('timeout = ', 'Timeout configuration'),
                ('max_requests = ', 'Max requests configuration'),
                ('def when_ready', 'Server ready hook'),
                ('def on_exit', 'Server exit hook'),
            ]
            
            for pattern, desc in checks:
                self._check_file_contains(gunicorn_file, pattern, f"Gunicorn: {desc}")
    
    def validate_migrations(self):
        """Check for pending migrations."""
        print(f"\n{BOLD}{BLUE}=== Database Migrations ==={RESET}")
        
        migrations_dir = self.backend_root / 'apps/students/migrations'
        if migrations_dir.exists():
            migration_files = list(migrations_dir.glob('*.py'))
            if len(migration_files) > 1:  # More than __init__.py
                self._print('PASS', 
                           f"Database migrations present ({len(migration_files)} files)")
                self.checks_passed += 1
            else:
                self._print('WARN', "Few database migrations found")
                self.checks_warned += 1
        
        # Check that migrations exist for new fields
        for app in ['students', 'authentication', 'enrollment', 'academics']:
            app_migrations = self.backend_root / f'apps/{app}/migrations'
            if app_migrations.exists():
                files = list(app_migrations.glob('*.py'))
                if len(files) > 1:
                    self._print('PASS', f"App '{app}' has migrations")
                    self.checks_passed += 1
                else:
                    self._print('WARN', f"App '{app}' has few migrations")
                    self.checks_warned += 1
    
    def validate_secrets_not_in_git(self):
        """Ensure secrets are not committed."""
        print(f"\n{BOLD}{BLUE}=== Secret Management ==={RESET}")
        
        # Check .gitignore excludes sensitive files
        gitignore = self.workspace_root / '.gitignore'
        sensitive_patterns = ['.env', 'db.sqlite3', '*.pem', 'secrets.json']
        
        if gitignore.exists():
            gitignore_content = gitignore.read_text()
            for pattern in sensitive_patterns:
                if pattern in gitignore_content:
                    self._print('PASS', f".gitignore excludes: {pattern}")
                    self.checks_passed += 1
                else:
                    self._print('WARN', f".gitignore should exclude: {pattern}")
                    self.checks_warned += 1
        else:
            self._print('WARN', ".gitignore file not found")
            self.checks_warned += 1
    
    def generate_summary(self):
        """Generate validation summary."""
        total = self.checks_passed + self.checks_failed + self.checks_warned
        pass_percent = (self.checks_passed / total * 100) if total > 0 else 0
        
        print(f"\n{BOLD}{BLUE}{'='*60}{RESET}")
        print(f"{BOLD}Production Readiness Summary{RESET}")
        print(f"{BOLD}{BLUE}{'='*60}{RESET}")
        
        print(f"\n{GREEN}✓ Passed: {self.checks_passed}{RESET}")
        print(f"{RED}✗ Failed: {self.checks_failed}{RESET}")
        print(f"{YELLOW}⚠ Warned: {self.checks_warned}{RESET}")
        print(f"{BOLD}Total: {total}{RESET}\n")
        
        print(f"Status: {pass_percent:.1f}% ready for production\n")
        
        if self.checks_failed == 0:
            print(f"{GREEN}{BOLD}✓ All critical checks passed!{RESET}")
            if self.checks_warned > 0:
                print(f"{YELLOW}⚠ Please review {self.checks_warned} warnings{RESET}")
            return True
        else:
            print(f"{RED}{BOLD}✗ Fix {self.checks_failed} failed checks before production{RESET}")
            return False
    
    def run_all_checks(self) -> bool:
        """Run all validation checks."""
        print(f"\n{BOLD}{BLUE}Grade Portal Phase 3b - Production Readiness Validator{RESET}\n")
        
        self.validate_backend_structure()
        self.validate_frontend_structure()
        self.validate_docker_setup()
        self.validate_environment_files()
        self.validate_security_configuration()
        self.validate_database_setup()
        self.validate_api_persistence()
        self.validate_logging_setup()
        self.validate_gunicorn_config()
        self.validate_migrations()
        self.validate_secrets_not_in_git()
        self.validate_deployment_docs()
        
        return self.generate_summary()


def main():
    """Main entry point."""
    workspace_root = os.environ.get('WORKSPACE_ROOT')
    if not workspace_root:
        workspace_root = Path(__file__).parent
    
    validator = ProductionValidator(workspace_root)
    success = validator.run_all_checks()
    
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
