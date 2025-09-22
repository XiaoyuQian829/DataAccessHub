# apps/permissions/admin.py

from django.contrib import admin
from .models import Role, Permission, RolePermission, UserRole, PermissionPolicy

@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ['name', 'description', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'description']
    ordering = ['name']

@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = ['name', 'permission_type', 'resource', 'description']
    list_filter = ['permission_type']
    search_fields = ['name', 'description', 'resource']
    ordering = ['permission_type', 'name']

@admin.register(RolePermission)
class RolePermissionAdmin(admin.ModelAdmin):
    list_display = ['role', 'permission', 'granted_at', 'granted_by']
    list_filter = ['granted_at', 'role', 'permission']
    search_fields = ['role__name', 'permission__name']
    ordering = ['role__name', 'permission__name']

@admin.register(UserRole)
class UserRoleAdmin(admin.ModelAdmin):
    list_display = ['user', 'role', 'assigned_at', 'assigned_by', 'is_active', 'expires_at']
    list_filter = ['is_active', 'assigned_at', 'role']
    search_fields = ['user__username', 'role__name']
    ordering = ['user__username', 'role__name']
    date_hierarchy = 'assigned_at'

@admin.register(PermissionPolicy)
class PermissionPolicyAdmin(admin.ModelAdmin):
    list_display = ['name', 'policy_type', 'is_active', 'created_at', 'created_by']
    list_filter = ['policy_type', 'is_active', 'created_at']
    search_fields = ['name', 'description']
    ordering = ['name'] 