# apps/approvals/admin.py

from django.contrib import admin
from .models import ApprovalRequest, ApprovalStep, ApprovalFlowTemplate, ApprovalFlowStepTemplate

@admin.register(ApprovalRequest)
class ApprovalRequestAdmin(admin.ModelAdmin):
    list_display = ['title', 'applicant', 'status', 'current_step', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['title', 'applicant__username']
    ordering = ['-created_at']
    date_hierarchy = 'created_at'
    readonly_fields = ['created_at', 'updated_at']

@admin.register(ApprovalStep)
class ApprovalStepAdmin(admin.ModelAdmin):
    list_display = ['request', 'step_number', 'approver', 'approved', 'acted_at']
    list_filter = ['approved', 'acted_at', 'step_number']
    search_fields = ['request__title', 'approver__username']
    ordering = ['request', 'step_number']
    readonly_fields = ['acted_at'] 

@admin.register(ApprovalFlowTemplate)
class ApprovalFlowTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'description', 'is_active', 'created_at', 'updated_at']
    search_fields = ['name', 'description']
    list_filter = ['is_active', 'created_at']
    ordering = ['name']

@admin.register(ApprovalFlowStepTemplate)
class ApprovalFlowStepTemplateAdmin(admin.ModelAdmin):
    list_display = ['flow_template', 'step_number', 'node_type', 'name', 'is_parallel', 'condition']
    search_fields = ['flow_template__name', 'name', 'node_type', 'condition']
    list_filter = ['node_type', 'is_parallel', 'flow_template']
    ordering = ['flow_template', 'step_number'] 