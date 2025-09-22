# apps/approvals/tests/test_simple.py

from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.approvals.models import ApprovalRequest, ApprovalFlowTemplate, ApprovalFlowStepTemplate

User = get_user_model()

class SimpleApprovalTest(TestCase):
    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        # Create a simple flow template
        self.flow_template = ApprovalFlowTemplate.objects.create(
            name='normal',
            description='Normal approval flow',
            is_active=True
        )
        
        # Create step template
        ApprovalFlowStepTemplate.objects.create(
            flow_template=self.flow_template,
            step_number=1,
            node_type='ADMIN',
            name='Admin approval'
        )

    def test_create_approval_request(self):
        """Test creating a basic approval request."""
        request = ApprovalRequest.objects.create(
            applicant=self.user,
            title="Test Request",
            description="This is a test",
            sensitivity='normal'
        )
        
        self.assertEqual(request.applicant, self.user)
        self.assertEqual(request.title, "Test Request")
        self.assertEqual(request.status, 'PENDING')
        self.assertEqual(request.current_step, 1)

    def test_flow_template_exists(self):
        """Test that flow template was created."""
        template = ApprovalFlowTemplate.objects.get(name='normal')
        self.assertEqual(template.description, 'Normal approval flow')
        self.assertTrue(template.is_active)
        
        # Test step template
        step = template.steps.first()
        self.assertEqual(step.step_number, 1)
        self.assertEqual(step.node_type, 'ADMIN')