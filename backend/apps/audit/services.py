# apps/audit/services.py

from .models import AuditLog
from django.contrib.contenttypes.models import ContentType

def log_action(user, action, target, metadata=None):
    """
    Create an audit log entry for a specific user action.
    """
    AuditLog.objects.create(
        user=user,
        action=action,
        target_type=ContentType.objects.get_for_model(target.__class__),
        target_id=target.id,
        metadata=metadata or {}
    )
