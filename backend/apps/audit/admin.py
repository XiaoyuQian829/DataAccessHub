# apps/audit/admin.py

from django.contrib import admin
from .models import AuditLog

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'action', 'target_type', 'target_id', 'timestamp']
    list_filter = ['action', 'timestamp', 'target_type']
    search_fields = ['user__username', 'action', 'target_type__model']
    ordering = ['-timestamp']
    date_hierarchy = 'timestamp'
    readonly_fields = ['user', 'action', 'target_type', 'target_id', 'timestamp', 'metadata']
    
    def has_add_permission(self, request):
        """Disable manual creation of audit logs."""
        return False
    
    def has_change_permission(self, request, obj=None):
        """Disable editing of audit logs."""
        return False 