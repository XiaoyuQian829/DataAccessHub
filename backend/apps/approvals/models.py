# apps/approvals/models.py

from django.db import models
from django.conf import settings

class ApprovalRequest(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('CANCELLED', 'Cancelled'),
    ]
    SENSITIVITY_CHOICES = [
        ('normal', 'Normal'),
        ('high', 'High Sensitivity'),
    ]

    applicant = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    sensitivity = models.CharField(max_length=20, choices=SENSITIVITY_CHOICES, default='normal')
    current_step = models.IntegerField(default=1)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class ApprovalStep(models.Model):
    request = models.ForeignKey(ApprovalRequest, on_delete=models.CASCADE, related_name='steps')
    step_number = models.IntegerField()
    approver = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    approved = models.BooleanField(null=True)  # None: pending, True: approved, False: rejected
    comment = models.TextField(blank=True)
    acted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('request', 'step_number')
        ordering = ['step_number']

class ApprovalFlowTemplate(models.Model):
    """Approval flow template, e.g., normal approval, high sensitivity approval."""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class ApprovalFlowStepTemplate(models.Model):
    """Step template for approval flow."""
    NODE_TYPE_CHOICES = [
        ('PI', 'PI Review'),
        ('ETHICS', 'Ethics Review'),
        ('ADMIN', 'Admin Review'),
        ('DUAL', 'Dual Approval'),
        ('AI', 'AI Suggestion'),
        ('ARBITER', 'Arbiter'),
    ]
    flow_template = models.ForeignKey(ApprovalFlowTemplate, on_delete=models.CASCADE, related_name='steps')
    step_number = models.IntegerField()
    node_type = models.CharField(max_length=20, choices=NODE_TYPE_CHOICES)
    name = models.CharField(max_length=100)
    is_parallel = models.BooleanField(default=False, help_text='Is this a parallel step (e.g., dual approval)?')
    condition = models.CharField(max_length=255, blank=True, help_text='Condition expression, e.g., high_sensitivity')

    class Meta:
        unique_together = ('flow_template', 'step_number', 'node_type')
        ordering = ['flow_template', 'step_number']

    def __str__(self):
        return f"{self.flow_template.name} - Step {self.step_number}: {self.name}"
