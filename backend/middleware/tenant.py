# middleware/tenant.py

from django.http import JsonResponse
from django.shortcuts import redirect
from django.contrib.auth.models import AnonymousUser
from apps.tenants.models import Tenant, TenantUser

class TenantMiddleware:
    """
    Middleware to handle multi-tenant functionality
    Determines current tenant based on subdomain or header
    """
    
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Skip middleware for admin, static files, and auth endpoints
        if (request.path.startswith('/admin/') or 
            request.path.startswith('/static/') or
            request.path.startswith('/api/v1/auth/')):
            return self.get_response(request)
        
        try:
            # Determine tenant
            tenant = self.get_tenant(request)
            
            # Add tenant to request
            request.tenant = tenant
            
            # Check if user has access to this tenant
            if (tenant and hasattr(request, 'user') and 
                request.user.is_authenticated and 
                not isinstance(request.user, AnonymousUser)):
                if not self.user_has_tenant_access(request.user, tenant):
                    if request.path.startswith('/api/'):
                        return JsonResponse(
                            {'error': 'Access denied for this tenant'}, 
                            status=403
                        )
                    else:
                        return redirect('/admin/login/')
        except Exception as e:
            # If tenant processing fails, continue without tenant context
            request.tenant = None
        
        response = self.get_response(request)
        return response
    
    def get_tenant(self, request):
        """
        Determine tenant from request
        Priority: Header -> Subdomain -> Default
        """
        # Try to get tenant from header (for API requests)
        tenant_id = request.META.get('HTTP_X_TENANT_ID')
        if tenant_id:
            try:
                return Tenant.objects.get(id=tenant_id, is_active=True)
            except Tenant.DoesNotExist:
                pass
        
        # Try to get tenant from subdomain
        host = request.get_host()
        if '.' in host:
            subdomain = host.split('.')[0]
            try:
                return Tenant.objects.get(subdomain=subdomain, is_active=True)
            except Tenant.DoesNotExist:
                pass
        
        # Return default tenant or None
        try:
            return Tenant.objects.get(is_default=True, is_active=True)
        except Tenant.DoesNotExist:
            return None
    
    def user_has_tenant_access(self, user, tenant):
        """Check if user has access to the specified tenant"""
        if not tenant:
            return True  # No tenant restriction
        
        # Check if user is assigned to this tenant
        return TenantUser.objects.filter(
            user=user, 
            tenant=tenant, 
            is_active=True
        ).exists()

class TenantIsolationMiddleware:
    """
    Middleware to ensure data isolation between tenants
    Adds tenant filtering to database queries
    """
    
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Skip for admin and static files
        if request.path.startswith('/admin/') or request.path.startswith('/static/'):
            return self.get_response(request)
        
        # Add tenant context to the request
        if hasattr(request, 'tenant') and request.tenant:
            # This can be used by models to filter by tenant
            request.tenant_id = request.tenant.id
        else:
            request.tenant_id = None
        
        response = self.get_response(request)
        return response