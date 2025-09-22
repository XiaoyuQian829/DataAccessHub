# apps/accounts/models.py

from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    """Extended user model with additional fields for DataAccessHub."""
    
    employee_id = models.CharField(max_length=50, unique=True, null=True, blank=True)
    department = models.CharField(max_length=100, blank=True)
    position = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    manager = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='subordinates')
    
    # SSO integration fields
    sso_provider = models.CharField(max_length=50, blank=True)
    sso_user_id = models.CharField(max_length=255, blank=True)
    
    # Account status
    is_approved = models.BooleanField(default=False)
    approved_by = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_users')
    approved_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'auth_user_extended'
    
    def __str__(self):
        return f"{self.username} ({self.get_full_name()})"
    
    def get_roles(self):
        """Get active user roles."""
        return self.userrole_set.filter(is_active=True).select_related('role')
    
    def has_permission(self, permission_type, resource=None):
        """Check if user has specific permission."""
        from apps.permissions.models import Permission, RolePermission
        
        user_roles = self.get_roles().values_list('role', flat=True)
        permissions = RolePermission.objects.filter(
            role__in=user_roles,
            permission__permission_type=permission_type
        ).select_related('permission')
        
        if resource:
            permissions = permissions.filter(
                models.Q(permission__resource=resource) | 
                models.Q(permission__resource='all')
            )
        
        return permissions.exists()

class UserProfile(models.Model):
    """Additional profile information for users."""
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE)
    # avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)  # Disabled for testing
    bio = models.TextField(blank=True)
    timezone = models.CharField(max_length=50, default='Australia/Brisbane')
    language = models.CharField(max_length=10, default='en')
    
    # Notification preferences
    email_notifications = models.BooleanField(default=True)
    approval_notifications = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.user.username} Profile"