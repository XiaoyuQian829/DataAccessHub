# middleware/permissions.py

from django.http import JsonResponse
from django.shortcuts import redirect
from django.urls import reverse
from django.contrib.auth.models import AnonymousUser
from apps.permissions.models import UserRole, Permission

class PermissionInjectionMiddleware:
    """
    Middleware to inject user permissions into request object
    and handle permission-based access control
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        
        # URLs that don't require authentication
        self.public_urls = [
            '/admin/login/',
            '/api/v1/auth/login/',
            '/api/v1/auth/refresh/',
            '/static/',
            '/swagger/',
            '/redoc/',
        ]
        
        # API endpoints that require specific permissions
        self.api_permissions = {
            '/api/v1/approvals/': ['APPROVAL_VIEW', 'APPROVAL_SUBMIT'],
            '/api/v1/datasets/': ['DATASET_VIEW', 'DATASET_MANAGE'],
            '/api/v1/permissions/': ['PERMISSION_MANAGE'],
        }

    def __call__(self, request):
        # Skip middleware for public URLs
        if any(request.path.startswith(url) for url in self.public_urls):
            return self.get_response(request)
        
        try:
            # Inject user permissions into request
            if hasattr(request, 'user') and request.user.is_authenticated:
                request.user_permissions = self.get_user_permissions(request.user)
                request.user_roles = self.get_user_roles(request.user)
            else:
                request.user_permissions = set()
                request.user_roles = set()
            
            # Check API permissions for API endpoints (except auth)
            if request.path.startswith('/api/') and not request.path.startswith('/api/v1/auth/'):
                if not self.check_api_permissions(request):
                    return JsonResponse(
                        {'error': 'Insufficient permissions'}, 
                        status=403
                    )
            
            # Check web interface permissions (except admin)
            elif not request.path.startswith('/admin/') and not self.check_web_permissions(request):
                return redirect('/admin/login/')
        except Exception as e:
            # If permission processing fails, set empty permissions
            request.user_permissions = set()
            request.user_roles = set()
        
        response = self.get_response(request)
        return response
    
    def get_user_permissions(self, user):
        """Get all permissions for the user"""
        permissions = set()
        
        # Get permissions through roles
        user_roles = UserRole.objects.filter(user=user, is_active=True)
        for user_role in user_roles:
            role_permissions = Permission.objects.filter(
                rolepermission__role=user_role.role
            ).values_list('name', flat=True)
            permissions.update(role_permissions)
        
        return permissions
    
    def get_user_roles(self, user):
        """Get all active roles for the user"""
        return set(
            UserRole.objects.filter(user=user, is_active=True)
            .values_list('role__name', flat=True)
        )
    
    def check_api_permissions(self, request):
        """Check if user has permission to access API endpoint"""
        if isinstance(request.user, AnonymousUser):
            return False
        
        # Check specific API permissions
        for url_pattern, required_permissions in self.api_permissions.items():
            if request.path.startswith(url_pattern):
                # Check if user has any of the required permissions
                if not any(perm in request.user_permissions for perm in required_permissions):
                    return False
        
        return True
    
    def check_web_permissions(self, request):
        """Check if user has permission to access web interface"""
        if isinstance(request.user, AnonymousUser):
            return False
        
        # Users with any role can access basic web interface
        return len(request.user_roles) > 0

class RequestLoggingMiddleware:
    """
    Middleware to log all requests for audit purposes
    """
    
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Import here to avoid circular imports
        from apps.audit.services import log_action
        
        # Log request if user is authenticated
        if hasattr(request, 'user') and not isinstance(request.user, AnonymousUser):
            log_action(
                user=request.user,
                action='REQUEST',
                obj=None,
                metadata={
                    'method': request.method,
                    'path': request.path,
                    'user_agent': request.META.get('HTTP_USER_AGENT', ''),
                    'ip_address': self.get_client_ip(request),
                }
            )
        
        response = self.get_response(request)
        return response
    
    def get_client_ip(self, request):
        """Get client IP address from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip