# apps/tenants/models.py

from django.db import models
from django.conf import settings
from django.core.validators import RegexValidator

class Tenant(models.Model):
    """
    Tenant model for multi-tenancy support
    Each tenant represents an organization or isolated environment
    """
    name = models.CharField(max_length=100, unique=True)
    subdomain = models.CharField(
        max_length=50, 
        unique=True, 
        validators=[
            RegexValidator(
                regex=r'^[a-z0-9-]+$',
                message='Subdomain can only contain lowercase letters, numbers, and hyphens'
            )
        ],
        help_text='Used for subdomain-based tenant identification'
    )
    domain = models.CharField(max_length=100, blank=True, null=True)
    description = models.TextField(blank=True)
    
    # Configuration
    is_active = models.BooleanField(default=True)
    is_default = models.BooleanField(default=False)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Settings (stored as JSON)
    settings = models.JSONField(default=dict, blank=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        # Ensure only one default tenant
        if self.is_default:
            Tenant.objects.filter(is_default=True).update(is_default=False)
        super().save(*args, **kwargs)

class TenantUser(models.Model):
    """
    Many-to-many relationship between users and tenants
    Users can belong to multiple tenants with different roles
    """
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    
    # User role within this tenant
    role = models.CharField(
        max_length=50,
        choices=[
            ('admin', 'Tenant Administrator'),
            ('user', 'Regular User'),
            ('viewer', 'Read-only User'),
        ],
        default='user'
    )
    
    # Status
    is_active = models.BooleanField(default=True)
    joined_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('tenant', 'user')
        ordering = ['tenant', 'user']
    
    def __str__(self):
        return f"{self.user.username} @ {self.tenant.name}"

class TenantAwareModel(models.Model):
    """
    Abstract base model that adds tenant awareness to any model
    """
    tenant = models.ForeignKey(
        Tenant, 
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        help_text='Leave blank for global data'
    )
    
    class Meta:
        abstract = True
    
    def save(self, *args, **kwargs):
        # Auto-assign tenant from request context if available
        if not self.tenant and hasattr(self, '_current_tenant'):
            self.tenant = self._current_tenant
        super().save(*args, **kwargs)