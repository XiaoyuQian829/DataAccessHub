# apps/datasets/admin.py

from django.contrib import admin
from .models import Dataset, DatasetField, DatasetAccess

@admin.register(Dataset)
class DatasetAdmin(admin.ModelAdmin):
    list_display = ['name', 'description', 'created_by', 'created_at', 'is_active']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'description']
    ordering = ['name']
    date_hierarchy = 'created_at'

@admin.register(DatasetField)
class DatasetFieldAdmin(admin.ModelAdmin):
    list_display = ['dataset', 'name', 'display_name', 'sensitivity_level', 'is_required', 'order']
    list_filter = ['sensitivity_level', 'is_required', 'dataset']
    search_fields = ['name', 'display_name', 'dataset__name']
    ordering = ['dataset__name', 'order', 'name']

@admin.register(DatasetAccess)
class DatasetAccessAdmin(admin.ModelAdmin):
    list_display = ['user', 'dataset', 'access_level', 'granted_by', 'granted_at', 'is_active']
    list_filter = ['access_level', 'is_active', 'granted_at']
    search_fields = ['user__username', 'dataset__name']
    ordering = ['user__username', 'dataset__name']
    date_hierarchy = 'granted_at' 