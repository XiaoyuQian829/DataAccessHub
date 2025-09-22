# apps/approvals/tests/test_approval_flow.py

from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone

from apps.approvals.models import ApprovalRequest, ApprovalStep, ApprovalFlowTemplate, ApprovalFlowStepTemplate
from apps.approvals.services import submit_request, approve_step, reject_step

User = get_user_model()

class ApprovalFlowTestCase(TestCase):
    def setUp(self):
        """Set up test data."""
        # Create test users
        self.applicant = User.objects.create_user(
            username='applicant',
            email='applicant@test.com',
            password='testpass123'
        )
        
        self.approver1 = User.objects.create_user(
            username='approver1',
            email='approver1@test.com',
            password='testpass123'
        )
        
        self.approver2 = User.objects.create_user(
            username='approver2',
            email='approver2@test.com',
            password='testpass123'
        )
        
        self.client = Client()
        
        # Create approval flow template for testing
        self.flow_template = ApprovalFlowTemplate.objects.create(
            name='normal',
            description='Normal approval flow for testing',
            is_active=True
        )
        
        # Create flow step templates
        ApprovalFlowStepTemplate.objects.create(
            flow_template=self.flow_template,
            step_number=1,
            node_type='REVIEWER',
            name='First review step'
        )
        
        ApprovalFlowStepTemplate.objects.create(
            flow_template=self.flow_template,
            step_number=2,
            node_type='ADMIN',
            name='Admin approval step'
        )

    def test_submit_approval_request(self):
        """Test submitting a new approval request."""
        approvers = [self.approver1, self.approver2]
        
        request = submit_request(
            applicant=self.applicant,
            title="Test Request",
            description="This is a test request",
            approvers=approvers
        )
        
        # Check request was created
        self.assertEqual(request.applicant, self.applicant)
        self.assertEqual(request.title, "Test Request")
        self.assertEqual(request.status, "PENDING")
        self.assertEqual(request.current_step, 1)
        
        # Check approval steps were created
        steps = request.steps.all()
        self.assertEqual(steps.count(), 2)
        
        # Check step order
        step1 = steps.get(step_number=1)
        step2 = steps.get(step_number=2)
        self.assertEqual(step1.approver, self.approver1)
        self.assertEqual(step2.approver, self.approver2)
        self.assertIsNone(step1.approved)
        self.assertIsNone(step2.approved)

    def test_approve_first_step(self):
        """Test approving the first step of a multi-step approval."""
        # Create approval request
        request = submit_request(
            applicant=self.applicant,
            title="Test Request",
            description="This is a test request",
            approvers=[self.approver1, self.approver2]
        )
        
        # Approve first step
        approve_step(request.id, self.approver1, "Looks good")
        
        # Refresh from database
        request.refresh_from_db()
        step1 = request.steps.get(step_number=1)
        
        # Check step was approved
        self.assertTrue(step1.approved)
        self.assertEqual(step1.comment, "Looks good")
        self.assertIsNotNone(step1.acted_at)
        
        # Check request moved to next step
        self.assertEqual(request.current_step, 2)
        self.assertEqual(request.status, "PENDING")

    def test_approve_final_step(self):
        """Test approving the final step completes the request."""
        # Create approval request with single approver
        request = submit_request(
            applicant=self.applicant,
            title="Test Request",
            description="This is a test request",
            approvers=[self.approver1]
        )
        
        # Approve the only step
        approve_step(request.id, self.approver1, "Approved")
        
        # Refresh from database
        request.refresh_from_db()
        
        # Check request is approved
        self.assertEqual(request.status, "APPROVED")
        self.assertEqual(request.current_step, 1)

    def test_reject_step(self):
        """Test rejecting a step rejects the entire request."""
        request = submit_request(
            applicant=self.applicant,
            title="Test Request",
            description="This is a test request",
            approvers=[self.approver1, self.approver2]
        )
        
        # Reject first step
        reject_step(request.id, self.approver1, "Not approved")
        
        # Refresh from database
        request.refresh_from_db()
        step1 = request.steps.get(step_number=1)
        
        # Check step was rejected
        self.assertFalse(step1.approved)
        self.assertEqual(step1.comment, "Not approved")
        
        # Check request was rejected
        self.assertEqual(request.status, "REJECTED")

    def test_unauthorized_approval(self):
        """Test that unauthorized users cannot approve steps."""
        request = submit_request(
            applicant=self.applicant,
            title="Test Request",
            description="This is a test request",
            approvers=[self.approver1]
        )
        
        # Try to approve with wrong user
        with self.assertRaises(PermissionError):
            approve_step(request.id, self.approver2, "Wrong user")

    def test_duplicate_approval(self):
        """Test that steps cannot be approved twice."""
        request = submit_request(
            applicant=self.applicant,
            title="Test Request",
            description="This is a test request",
            approvers=[self.approver1]
        )
        
        # Approve first time
        approve_step(request.id, self.approver1, "First approval")
        
        # Try to approve again
        with self.assertRaises(PermissionError):
            approve_step(request.id, self.approver1, "Second approval")

    def test_view_approval_list(self):
        """Test the approval list view."""
        # Create a request
        request = submit_request(
            applicant=self.applicant,
            title="Test Request",
            description="This is a test request",
            approvers=[self.approver1]
        )
        
        # Login as applicant
        self.client.force_login(self.applicant)
        
        # Access the list view
        response = self.client.get(reverse('approvals:list'))
        
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Test Request")

    def test_submit_approval_form(self):
        """Test submitting approval request through form."""
        self.client.force_login(self.applicant)
        
        # Submit form data
        form_data = {
            'title': 'Form Test Request',
            'description': 'This is a form test',
            'approvers': [self.approver1.id]
        }
        
        response = self.client.post(reverse('approvals:submit'), form_data)
        
        # Check redirect
        self.assertRedirects(response, reverse('approvals:list'))
        
        # Check request was created
        request = ApprovalRequest.objects.get(title='Form Test Request')
        self.assertEqual(request.applicant, self.applicant)
        self.assertEqual(request.status, 'PENDING')

    def test_approval_action_form(self):
        """Test approval action through form."""
        # Create request
        request = submit_request(
            applicant=self.applicant,
            title="Test Request",
            description="This is a test request",
            approvers=[self.approver1]
        )
        
        # Login as approver
        self.client.force_login(self.approver1)
        
        # Submit approval
        form_data = {
            'decision': 'approve',
            'comment': 'Approved via form'
        }
        
        response = self.client.post(
            reverse('approvals:action', args=[request.id]), 
            form_data
        )
        
        # Check redirect
        self.assertRedirects(response, reverse('approvals:list'))
        
        # Check request was approved
        request.refresh_from_db()
        self.assertEqual(request.status, 'APPROVED')

    def test_audit_logging(self):
        """Test that audit logs are created for actions."""
        try:
            from apps.audit.models import AuditLog
            
            # Create and approve request
            request = submit_request(
                applicant=self.applicant,
                title="Test Request",
                description="This is a test request",
                approvers=[self.approver1]
            )
            
            # Check submit log
            submit_log = AuditLog.objects.filter(
                action='submit_request',
                target_id=request.id
            ).first()
            self.assertIsNotNone(submit_log)
            self.assertEqual(submit_log.user, self.applicant)
            
            # Approve request
            approve_step(request.id, self.approver1, "Approved")
            
            # Check approve log
            approve_log = AuditLog.objects.filter(
                action='approve_step',
                target_id=request.steps.first().id
            ).first()
            self.assertIsNotNone(approve_log)
            self.assertEqual(approve_log.user, self.approver1)
        except ImportError:
            # Skip audit test if audit module is not fully set up
            self.skipTest("Audit module not fully configured") 