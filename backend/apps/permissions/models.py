# apps/permissions/models.py

from django.db import models
from django.conf import settings
from django.contrib.auth.models import Group

class Role(models.Model):
    """User roles for permission management."""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return self.name

class Permission(models.Model):
    """Granular permissions for different actions."""
    PERMISSION_TYPES = [
        ('DATASET_READ', 'Read Dataset'),
        ('DATASET_WRITE', 'Write Dataset'),
        ('DATASET_ADMIN', 'Admin Dataset'),
        ('APPROVAL_SUBMIT', 'Submit Approval'),
        ('APPROVAL_APPROVE', 'Approve Request'),
        ('AUDIT_VIEW', 'View Audit Logs'),
        ('USER_MANAGE', 'Manage Users'),
    ]
    
    name = models.CharField(max_length=100, unique=True)
    permission_type = models.CharField(max_length=50, choices=PERMISSION_TYPES)
    description = models.TextField(blank=True)
    resource = models.CharField(max_length=255, blank=True)  # e.g., dataset name, "all"
    
    def __str__(self):
        return self.name

class RolePermission(models.Model):
    """Many-to-many relationship between roles and permissions."""
    role = models.ForeignKey(Role, on_delete=models.CASCADE)
    permission = models.ForeignKey(Permission, on_delete=models.CASCADE)
    granted_at = models.DateTimeField(auto_now_add=True)
    granted_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    
    class Meta:
        unique_together = ('role', 'permission')
    
    def __str__(self):
        return f"{self.role.name} -> {self.permission.name}"

class UserRole(models.Model):
    """Many-to-many relationship between users and roles."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    role = models.ForeignKey(Role, on_delete=models.CASCADE)
    assigned_at = models.DateTimeField(auto_now_add=True)
    assigned_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='assigned_roles')
    expires_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ('user', 'role')
    
    def __str__(self):
        return f"{self.user.username} -> {self.role.name}"

class PermissionPolicy(models.Model):
    """Policy-based permissions for specific resources."""
    POLICY_TYPES = [
        ('DATASET_ACCESS', 'Dataset Access Policy'),
        ('APPROVAL_WORKFLOW', 'Approval Workflow Policy'),
        ('AUDIT_POLICY', 'Audit Policy'),
    ]
    
    name = models.CharField(max_length=255)
    policy_type = models.CharField(max_length=50, choices=POLICY_TYPES)
    description = models.TextField(blank=True)
    conditions = models.JSONField(default=dict)  # Policy conditions
    actions = models.JSONField(default=dict)     # Allowed actions
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    
    def __str__(self):
        return self.name 