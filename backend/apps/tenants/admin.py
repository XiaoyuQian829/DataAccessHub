# apps/tenants/admin.py

from django.contrib import admin
from .models import Tenant, TenantUser

@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = ('name', 'subdomain', 'is_active', 'is_default', 'created_at')
    list_filter = ('is_active', 'is_default', 'created_at')
    search_fields = ('name', 'subdomain', 'domain')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'subdomain', 'domain', 'description')
        }),
        ('Configuration', {
            'fields': ('is_active', 'is_default', 'settings')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

@admin.register(TenantUser)
class TenantUserAdmin(admin.ModelAdmin):
    list_display = ('user', 'tenant', 'role', 'is_active', 'joined_at')
    list_filter = ('role', 'is_active', 'tenant', 'joined_at')
    search_fields = ('user__username', 'user__email', 'tenant__name')
    
    fieldsets = (
        ('Assignment', {
            'fields': ('tenant', 'user', 'role')
        }),
        ('Status', {
            'fields': ('is_active', 'joined_at')
        }),
    )