from rest_framework import serializers
from .models import ApprovalRequest, ApprovalStep
from apps.permissions.models import UserRole

class ApprovalStepSerializer(serializers.ModelSerializer):
    approver_username = serializers.CharField(source='approver.username', read_only=True)
    class Meta:
        model = ApprovalStep
        fields = ['id', 'step_number', 'approver', 'approver_username', 'approved', 'comment', 'acted_at']
        read_only_fields = ['id', 'acted_at', 'approver_username']

class ApprovalRequestSerializer(serializers.ModelSerializer):
    applicant_username = serializers.CharField(source='applicant.username', read_only=True)
    steps = ApprovalStepSerializer(many=True, read_only=True)

    class Meta:
        model = ApprovalRequest
        fields = [
            'id', 'title', 'description', 'sensitivity', 'status', 'current_step',
            'applicant', 'applicant_username', 'created_at', 'updated_at', 'steps'
        ]
        read_only_fields = ['id', 'status', 'current_step', 'created_at', 'updated_at', 'applicant_username', 'steps']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        user = self.context['request'].user if 'request' in self.context else None
        user_roles = set()
        if user and user.is_authenticated:
            user_roles = set(UserRole.objects.filter(user=user, is_active=True).values_list('role__name', flat=True))
        # Example rules:
        if 'Data Administrator' in user_roles or 'PI' in user_roles:
            # Full access
            return data
        if 'Ethics' in user_roles:
            # Mask sensitivity field
            data['sensitivity'] = '***'
            return data
        # Default: ordinary user, mask sensitivity and applicant
        data['sensitivity'] = '***'
        data['applicant_username'] = '***'
        return data 