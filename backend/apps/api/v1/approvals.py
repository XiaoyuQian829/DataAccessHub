# apps/api/v1/approvals.py

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model

from django.db import models

from apps.approvals.models import ApprovalRequest, ApprovalStep
from apps.approvals.serializers import ApprovalRequestSerializer, ApprovalStepSerializer
from apps.approvals.services import submit_request, approve_step, reject_step
from apps.permissions.models import UserRole

User = get_user_model()

class ApprovalRequestViewSet(viewsets.ModelViewSet):
    """
    API ViewSet for ApprovalRequest management
    
    Provides:
    - List approval requests (filtered by user permissions)
    - Create new approval requests
    - Retrieve specific approval request details
    - Update approval request (limited fields)
    - Delete approval request (if in pending status)
    """
    queryset = ApprovalRequest.objects.all()
    serializer_class = ApprovalRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Filter queryset based on user permissions"""
        user = self.request.user
        user_roles = set(UserRole.objects.filter(user=user, is_active=True).values_list('role__name', flat=True))
        
        # Data Administrators and PIs can see all requests
        if 'Data Administrator' in user_roles or 'PI' in user_roles:
            return ApprovalRequest.objects.all()
        
        # Ethics reviewers can see requests in their review step
        if 'Ethics' in user_roles:
            return ApprovalRequest.objects.filter(
                steps__approver=user,
                steps__approved__isnull=True
            ).distinct()
        
        # Users can see their own requests and requests they need to approve
        return ApprovalRequest.objects.filter(
            models.Q(applicant=user) | 
            models.Q(steps__approver=user)
        ).distinct()

    def perform_create(self, serializer):
        """Set applicant to current user when creating request"""
        serializer.save(applicant=self.request.user)

    def create(self, request, *args, **kwargs):
        """Create approval request and trigger workflow"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Use service to create request with workflow
        approval_request = submit_request(
            applicant=request.user,
            title=serializer.validated_data['title'],
            description=serializer.validated_data.get('description', ''),
            sensitivity=serializer.validated_data.get('sensitivity', 'normal')
        )
        
        response_serializer = self.get_serializer(approval_request)
        headers = self.get_success_headers(response_serializer.data)
        
        return Response(
            response_serializer.data, 
            status=status.HTTP_201_CREATED, 
            headers=headers
        )

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve current step of the approval request"""
        approval_request = self.get_object()
        comment = request.data.get('comment', '')
        
        try:
            updated_request = approve_step(
                request_id=approval_request.id,
                approver=request.user,
                comment=comment
            )
            serializer = self.get_serializer(updated_request)
            return Response(serializer.data)
            
        except PermissionError as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_403_FORBIDDEN
            )
        except ValueError as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject the approval request"""
        approval_request = self.get_object()
        comment = request.data.get('comment', '')
        
        try:
            updated_request = reject_step(
                request_id=approval_request.id,
                approver=request.user,
                comment=comment
            )
            serializer = self.get_serializer(updated_request)
            return Response(serializer.data)
            
        except PermissionError as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_403_FORBIDDEN
            )
        except ValueError as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'])
    def my_requests(self, request):
        """Get approval requests created by current user"""
        queryset = ApprovalRequest.objects.filter(applicant=request.user)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def pending_approvals(self, request):
        """Get requests waiting for current user's approval"""
        queryset = ApprovalRequest.objects.filter(
            steps__approver=request.user,
            steps__approved__isnull=True,
            status='PENDING'
        ).distinct()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

class ApprovalStepViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only API ViewSet for ApprovalStep
    
    Provides approval step history and details
    """
    queryset = ApprovalStep.objects.all()
    serializer_class = ApprovalStepSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Filter steps based on user permissions"""
        user = self.request.user
        user_roles = set(UserRole.objects.filter(user=user, is_active=True).values_list('role__name', flat=True))
        
        # Data Administrators and PIs can see all steps
        if 'Data Administrator' in user_roles or 'PI' in user_roles:
            return ApprovalStep.objects.all()
        
        # Users can see steps for requests they created or are approving
        return ApprovalStep.objects.filter(
            models.Q(request__applicant=user) | 
            models.Q(approver=user)
        ).distinct()