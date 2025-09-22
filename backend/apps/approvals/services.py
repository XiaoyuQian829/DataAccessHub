# apps/approvals/services.py

from django.utils import timezone
from django.db import transaction
from .models import ApprovalRequest, ApprovalStep, ApprovalFlowTemplate, ApprovalFlowStepTemplate
from apps.audit.services import log_action  # expected in audit/services.py
from apps.permissions.models import UserRole, Role
from django.contrib.auth import get_user_model
User = get_user_model()

# Node type to role name mapping
NODE_TYPE_ROLE_MAP = {
    'PI': 'PI',
    'ETHICS': 'Ethics',
    'ADMIN': 'Data Administrator',
    'ARBITER': 'Arbiter',
    # Add more mappings as needed
}

def submit_request(applicant, title, description, approvers, sensitivity='normal'):
    """
    Create a new approval request with dynamic approval steps based on sensitivity and node type.
    """
    with transaction.atomic():
        request = ApprovalRequest.objects.create(
            applicant=applicant,
            title=title,
            description=description,
            sensitivity=sensitivity
        )
        # Select flow template based on sensitivity
        flow_template = ApprovalFlowTemplate.objects.filter(
            is_active=True,
            name__icontains=sensitivity  # e.g. 'normal' or 'high'
        ).order_by('id').first()
        if not flow_template:
            raise Exception(f"No approval flow template found for sensitivity: {sensitivity}")
        # Generate steps from template
        for step_tpl in flow_template.steps.order_by('step_number'):
            node_type = step_tpl.node_type
            role_name = NODE_TYPE_ROLE_MAP.get(node_type)
            approver = None
            if role_name:
                # Find the first active user with this role
                user_role = UserRole.objects.filter(role__name=role_name, is_active=True).select_related('user').first()
                if user_role:
                    approver = user_role.user
            if not approver:
                # Fallback: use the first provided approver or applicant
                approver = approvers[0] if approvers else applicant
            ApprovalStep.objects.create(
                request=request,
                step_number=step_tpl.step_number,
                approver=approver
            )
        log_action(user=applicant, action="submit_request", target=request)
    return request

def approve_step(request_id, approver, comment=""):
    """
    Approve the current step of a given request if the approver matches.
    """
    request = ApprovalRequest.objects.select_for_update().get(id=request_id)
    current_step = request.steps.get(step_number=request.current_step)

    if current_step.approver != approver or current_step.approved is not None:
        raise PermissionError("Invalid approver or step already handled.")

    with transaction.atomic():
        current_step.approved = True
        current_step.comment = comment
        current_step.acted_at = timezone.now()
        current_step.save()

        log_action(user=approver, action="approve_step", target=current_step)

        if request.steps.filter(step_number__gt=current_step.step_number, approved__isnull=True).exists():
            request.current_step += 1
        else:
            request.status = "APPROVED"
        request.save()

def reject_step(request_id, approver, comment=""):
    """
    Reject the current step and mark the request as rejected.
    """
    request = ApprovalRequest.objects.select_for_update().get(id=request_id)
    current_step = request.steps.get(step_number=request.current_step)

    if current_step.approver != approver or current_step.approved is not None:
        raise PermissionError("Invalid approver or step already handled.")

    with transaction.atomic():
        current_step.approved = False
        current_step.comment = comment
        current_step.acted_at = timezone.now()
        current_step.save()

        request.status = "REJECTED"
        request.save()

        log_action(user=approver, action="reject_step", target=current_step)
