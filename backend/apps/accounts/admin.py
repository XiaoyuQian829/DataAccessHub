# apps/accounts/admin.py

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth import get_user_model
from apps.permissions.models import UserRole, Role

User = get_user_model()

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    """Custom user admin with automatic role assignment."""
    
    def save_model(self, request, obj, form, change):
        """Override save_model to automatically assign default role."""
        is_new_user = obj.pk is None  # Check if this is a new user
        super().save_model(request, obj, form, change)
        
        # Auto-assign default role for new users
        if is_new_user:
            try:
                # Get the default "User" role
                default_role = Role.objects.get(name='User')
                UserRole.objects.get_or_create(
                    user=obj,
                    role=default_role,
                    defaults={'assigned_by': request.user}
                )
                self.message_user(
                    request, 
                    f"User '{obj.username}' created and assigned default role '{default_role.name}'"
                )
            except Role.DoesNotExist:
                self.message_user(
                    request, 
                    f"User '{obj.username}' created but no default role found. Please assign manually."
                )
    
    def get_queryset(self, request):
        """Add user roles to the queryset for display."""
        return super().get_queryset(request).prefetch_related('userrole_set__role')
    
    def get_list_display(self, request):
        """Add role information to the user list."""
        list_display = list(super().get_list_display(request))
        list_display.append('get_roles')
        return list_display
    
    def get_roles(self, obj):
        """Display user roles in the admin list."""
        roles = obj.userrole_set.filter(is_active=True).values_list('role__name', flat=True)
        return ', '.join(roles) if roles else 'No roles'
    get_roles.short_description = 'Roles' 
