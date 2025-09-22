# apps/datasets/models.py

from django.db import models
from django.conf import settings

class Dataset(models.Model):
    """Dataset model for managing data access permissions."""
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return self.name

class DatasetField(models.Model):
    """Individual fields within a dataset with sensitivity levels."""
    SENSITIVITY_CHOICES = [
        ('PUBLIC', 'Public'),
        ('INTERNAL', 'Internal'),
        ('CONFIDENTIAL', 'Confidential'),
        ('RESTRICTED', 'Restricted'),
    ]
    
    dataset = models.ForeignKey(Dataset, on_delete=models.CASCADE, related_name='fields')
    name = models.CharField(max_length=255)
    display_name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    sensitivity_level = models.CharField(max_length=20, choices=SENSITIVITY_CHOICES, default='INTERNAL')
    is_required = models.BooleanField(default=False)
    order = models.IntegerField(default=0)
    
    class Meta:
        unique_together = ('dataset', 'name')
        ordering = ['order', 'name']
    
    def __str__(self):
        return f"{self.dataset.name}.{self.name}"

class DatasetAccess(models.Model):
    """User access permissions for datasets."""
    ACCESS_LEVEL_CHOICES = [
        ('READ', 'Read Only'),
        ('WRITE', 'Read & Write'),
        ('ADMIN', 'Administrator'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    dataset = models.ForeignKey(Dataset, on_delete=models.CASCADE)
    access_level = models.CharField(max_length=20, choices=ACCESS_LEVEL_CHOICES, default='READ')
    granted_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='granted_access')
    granted_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ('user', 'dataset')
    
    def __str__(self):
        return f"{self.user.username} -> {self.dataset.name} ({self.access_level})" 