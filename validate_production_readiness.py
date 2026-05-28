#!/usr/bin/env python
"""
Production Readiness Validation Script for Grade Portal Phase 3a
Checks all production hardening requirements
"""
import os
import sys
import subprocess
from pathlib import Path

# Color codes for output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

class ProductionValidator:
    def __init__(self):
        self.backend_dir = Path(__file__).parent / 'backend'
        self.frontend_dir = Path(__file__).parent / 'frontend'
        self.checks_passed = 0
        self.checks_failed = 0
        self.checks_warning = 0

    def print_header(self, text):
        """Print section header"""
        print(f"\n{BLUE}{'='*60}")
        print(f"  {text}")
        print(f"{'='*60}{RESET}\n")

    def print_pass(self, message):
        """Print passing check"""
        print(f"{GREEN}✓ {message}{RESET}")
        self.checks_passed += 1

    def print_fail(self, message):
        """Print failing check"""
        print(f"{RED}✗ {message}{RESET}")
        self.checks_failed += 1

    def print_warn(self, message):
        """Print warning"""
        print(f"{YELLOW}⚠ {message}{RESET}")
        self.checks_warning += 1

    def check_env_files(self):
        """Check if .env files exist and have production values"""
        self.print_header("Environment Configuration")

        # Backend .env
        backend_env = self.backend_dir / '.env'
        if backend_env.exists():
            self.print_pass("Backend .env file exists")
            with open(backend_env) as f:
                content = f.read()
                if 'DEBUG=False' in content:
                    self.print_pass("Backend DEBUG=False")
                else:
                    self.print_warn("Backend DEBUG is not explicitly set to False")
                
                if 'SECRET_KEY=' in content and 'change-me' not in content:
                    self.print_pass("Backend SECRET_KEY appears configured")
                else:
                    self.print_fail("Backend SECRET_KEY uses default value")
                
                if 'MYSQL_' in content or 'DATABASE_URL=' in content:
                    self.print_pass("Backend database configuration present")
                else:
                    self.print_warn("Backend database configuration may be incomplete")
        else:
            self.print_fail("Backend .env file not found")

        # Frontend .env
        frontend_env = self.frontend_dir / '.env'
        if frontend_env.exists():
            self.print_pass("Frontend .env file exists")
            with open(frontend_env) as f:
                content = f.read()
                if 'REACT_APP_USE_API_ONLY=true' in content:
                    self.print_pass("Frontend REACT_APP_USE_API_ONLY=true")
                else:
                    self.print_warn("Frontend REACT_APP_USE_API_ONLY is not set to true")
                
                if 'REACT_APP_API_BASE_URL=' in content:
                    self.print_pass("Frontend API_BASE_URL configured")
                else:
                    self.print_fail("Frontend API_BASE_URL not configured")
        else:
            self.print_warn("Frontend .env file not found (may be using build-time vars)")

    def check_backend_files(self):
        """Check backend implementation files"""
        self.print_header("Backend Implementation")

        # Check migration file
        migration_file = (self.backend_dir / 'apps' / 'students' / 'migrations' / 
                         '0002_profile_persistence_fields.py')
        if migration_file.exists():
            self.print_pass("Student profile migration created")
        else:
            self.print_warn("Student profile migration not found (may need to run makemigrations)")

        # Check serializers
        serializers_file = self.backend_dir / 'apps' / 'students' / 'serializers.py'
        if serializers_file.exists():
            with open(serializers_file) as f:
                content = f.read()
                if 'StudentProfileUpdateSerializer' in content:
                    self.print_pass("StudentProfileUpdateSerializer found")
                else:
                    self.print_fail("StudentProfileUpdateSerializer not found")
                
                if 'validate_email' in content:
                    self.print_pass("Email validation implemented")
                else:
                    self.print_warn("Email validation not found")

        # Check views
        views_file = self.backend_dir / 'apps' / 'students' / 'views.py'
        if views_file.exists():
            with open(views_file) as f:
                content = f.read()
                if 'methods=[\'get\', \'patch\']' in content or 'methods=[\'patch\', \'get\']' in content:
                    self.print_pass("PATCH method added to student profile endpoint")
                else:
                    self.print_fail("PATCH method not found on student profile endpoint")

        # Check profile service
        profile_service = self.backend_dir / 'apps' / 'students' / 'services' / 'profile.py'
        if profile_service.exists():
            self.print_pass("Profile service module created")
        else:
            self.print_fail("Profile service module not found")

        # Check security middleware
        security_middleware = self.backend_dir / 'shared' / 'middleware' / 'security.py'
        if security_middleware.exists():
            with open(security_middleware) as f:
                content = f.read()
                if 'SecurityHeadersMiddleware' in content:
                    self.print_pass("SecurityHeadersMiddleware found")
                else:
                    self.print_fail("SecurityHeadersMiddleware not implemented")
                
                if 'AuditLoggingMiddleware' in content:
                    self.print_pass("AuditLoggingMiddleware found")
                else:
                    self.print_warn("AuditLoggingMiddleware not implemented")
        else:
            self.print_fail("Security middleware file not found")

    def check_frontend_files(self):
        """Check frontend implementation files"""
        self.print_header("Frontend Implementation")

        # Check enrollmentStore.js
        enrollment_store = self.frontend_dir / 'src' / 'services' / 'enrollmentStore.js'
        if enrollment_store.exists():
            with open(enrollment_store) as f:
                content = f.read()
                if 'REACT_APP_USE_API_ONLY' in content:
                    self.print_pass("Enrollment store checks REACT_APP_USE_API_ONLY")
                else:
                    self.print_fail("Enrollment store doesn't check REACT_APP_USE_API_ONLY")
                
                if "throw new Error('Enrollment API is required in production mode')" in content:
                    self.print_pass("Production API-only mode enforced")
                else:
                    self.print_warn("Production API-only mode not explicitly enforced")
        else:
            self.print_fail("enrollmentStore.js not found")

        # Check studentApi.js
        student_api = self.frontend_dir / 'src' / 'services' / 'studentApi.js'
        if student_api.exists():
            with open(student_api) as f:
                content = f.read()
                if 'updateStudentProfile' in content:
                    self.print_pass("updateStudentProfile function exists")
                else:
                    self.print_fail("updateStudentProfile function not found")
                
                if 'fetchStudentProfile' in content:
                    self.print_pass("fetchStudentProfile function exists")
                else:
                    self.print_fail("fetchStudentProfile function not found")
        else:
            self.print_fail("studentApi.js not found")

        # Check apiClient.js
        api_client = self.frontend_dir / 'src' / 'services' / 'apiClient.js'
        if api_client.exists():
            with open(api_client) as f:
                content = f.read()
                if 'refreshAccessToken' in content:
                    self.print_pass("JWT refresh token handling implemented")
                else:
                    self.print_fail("JWT refresh token handling not found")
                
                if 'response.status === 401' in content:
                    self.print_pass("401 error handling for token expiration found")
                else:
                    self.print_warn("401 error handling not explicitly found")
        else:
            self.print_fail("apiClient.js not found")

        # Check Dashboard.jsx
        dashboard = self.frontend_dir / 'src' / 'components' / 'Dashboard.jsx'
        if dashboard.exists():
            with open(dashboard) as f:
                content = f.read()
                if 'updateStudentProfile' in content:
                    self.print_pass("Dashboard uses updateStudentProfile API")
                else:
                    self.print_warn("Dashboard doesn't seem to use updateStudentProfile")
                
                if "localStorage.setItem('currentStudent'" not in content:
                    self.print_pass("Dashboard no longer saves profile to localStorage")
                else:
                    self.print_fail("Dashboard still saves profile to localStorage")
        else:
            self.print_fail("Dashboard.jsx not found")

    def check_docker_setup(self):
        """Check Docker configuration"""
        self.print_header("Docker Setup")

        docker_compose = Path(__file__).parent / 'docker-compose.yml'
        if docker_compose.exists():
            self.print_pass("docker-compose.yml exists")
            with open(docker_compose) as f:
                content = f.read()
                if 'mysql' in content.lower():
                    self.print_pass("MySQL service configured in Docker Compose")
                else:
                    self.print_warn("MySQL service not found in Docker Compose")
        else:
            self.print_warn("docker-compose.yml not found")

    def check_documentation(self):
        """Check if deployment documentation exists"""
        self.print_header("Documentation")

        deployment_guide = Path(__file__).parent / 'DEPLOYMENT_GUIDE.md'
        if deployment_guide.exists():
            self.print_pass("DEPLOYMENT_GUIDE.md exists")
        else:
            self.print_warn("DEPLOYMENT_GUIDE.md not found")

    def check_dependencies(self):
        """Check if required dependencies are installed"""
        self.print_header("Dependencies")

        try:
            result = subprocess.run(
                [sys.executable, '-m', 'pip', 'show', 'django'],
                cwd=self.backend_dir,
                capture_output=True
            )
            if result.returncode == 0:
                self.print_pass("Django is installed")
            else:
                self.print_warn("Django not found (run pip install -r requirements.txt)")
        except Exception as e:
            self.print_warn(f"Could not check Django installation: {e}")

    def print_summary(self):
        """Print validation summary"""
        self.print_header("Validation Summary")
        
        total = self.checks_passed + self.checks_failed + self.checks_warning
        percentage = (self.checks_passed / total * 100) if total > 0 else 0
        
        print(f"Total Checks: {total}")
        print(f"{GREEN}Passed: {self.checks_passed}{RESET}")
        print(f"{YELLOW}Warnings: {self.checks_warning}{RESET}")
        print(f"{RED}Failed: {self.checks_failed}{RESET}")
        print(f"Success Rate: {percentage:.1f}%")
        
        if self.checks_failed == 0:
            print(f"\n{GREEN}✓ System appears production-ready!{RESET}")
            return 0
        else:
            print(f"\n{RED}✗ Please fix the failed checks above before deployment.{RESET}")
            return 1

    def run(self):
        """Run all validation checks"""
        print(f"\n{BLUE}Grade Portal — Phase 3a Production Readiness Validator{RESET}")
        
        self.check_env_files()
        self.check_backend_files()
        self.check_frontend_files()
        self.check_docker_setup()
        self.check_documentation()
        self.check_dependencies()
        
        return self.print_summary()


if __name__ == '__main__':
    validator = ProductionValidator()
    sys.exit(validator.run())
