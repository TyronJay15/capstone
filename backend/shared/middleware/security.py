"""
Security middleware for production hardening.
"""
import logging
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger(__name__)


class SecurityHeadersMiddleware(MiddlewareMixin):
    """Add security headers to all responses."""

    def process_response(self, request, response):
        """Add security headers."""
        # Prevent clickjacking attacks
        response['X-Frame-Options'] = 'DENY'
        
        # Prevent MIME type sniffing
        response['X-Content-Type-Options'] = 'nosniff'
        
        # Enable XSS protection
        response['X-XSS-Protection'] = '1; mode=block'
        
        # Referrer policy
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        # Content Security Policy (adjust based on your needs)
        csp = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' https: data:; "
            "connect-src 'self' https:; "
            "frame-ancestors 'none';"
        )
        response['Content-Security-Policy'] = csp
        
        return response


class AuditLoggingMiddleware(MiddlewareMixin):
    """Log authentication and API access for audit trail."""

    def process_request(self, request):
        """Log incoming requests."""
        if request.path.startswith('/api/'):
            user = request.user if request.user.is_authenticated else 'anonymous'
            method = request.method
            path = request.path
            
            if method in ['POST', 'PATCH', 'PUT', 'DELETE']:
                logger.info(
                    f'API {method} request',
                    extra={
                        'user': user,
                        'method': method,
                        'path': path,
                        'remote_addr': self._get_client_ip(request),
                    }
                )

    def process_response(self, request, response):
        """Log response status."""
        if request.path.startswith('/api/'):
            if response.status_code >= 400:
                user = request.user if request.user.is_authenticated else 'anonymous'
                logger.warning(
                    f'API error response',
                    extra={
                        'user': user,
                        'status': response.status_code,
                        'path': request.path,
                        'remote_addr': self._get_client_ip(request),
                    }
                )
        
        return response

    @staticmethod
    def _get_client_ip(request):
        """Extract client IP address."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class JSONErrorHandlerMiddleware(MiddlewareMixin):
    """Handle errors and return JSON responses."""

    def process_exception(self, request, exception):
        """Log exceptions and return appropriate response."""
        if request.path.startswith('/api/'):
            logger.error(
                'Unhandled exception in API',
                extra={'exception': str(exception)},
                exc_info=True
            )
