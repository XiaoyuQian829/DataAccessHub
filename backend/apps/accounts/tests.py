# apps/accounts/tests.py

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()

class AccountsTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            employee_id='EMP001',
            department='IT'
        )

    def test_user_creation(self):
        """Test creating a user."""
        self.assertEqual(self.user.username, 'testuser')
        self.assertEqual(self.user.email, 'test@example.com')
        self.assertEqual(self.user.employee_id, 'EMP001')
        self.assertEqual(self.user.department, 'IT')
        self.assertTrue(self.user.is_active)

    def test_user_string_representation(self):
        """Test user string representation."""
        self.assertEqual(str(self.user), 'testuser')

    def test_login_api(self):
        """Test JWT login API."""
        data = {
            'username': 'testuser',
            'password': 'testpass123'
        }
        response = self.client.post('/api/v1/auth/login/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_current_user_api(self):
        """Test current user API."""
        # First login to get token
        data = {
            'username': 'testuser',
            'password': 'testpass123'
        }
        login_response = self.client.post('/api/v1/auth/login/', data, format='json')
        token = login_response.data['access']
        
        # Test current user endpoint
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        response = self.client.get('/api/v1/auth/user/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'testuser')
        self.assertEqual(response.data['email'], 'test@example.com')