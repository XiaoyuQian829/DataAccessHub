# apps/datasets/tests.py

from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.datasets.models import Dataset, DatasetField

User = get_user_model()

class DatasetsTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        self.dataset = Dataset.objects.create(
            name='Test Dataset',
            description='A test dataset',
            created_by=self.user,
            is_active=True
        )

    def test_dataset_creation(self):
        """Test creating a dataset."""
        self.assertEqual(self.dataset.name, 'Test Dataset')
        self.assertEqual(self.dataset.created_by, self.user)
        self.assertTrue(self.dataset.is_active)

    def test_dataset_string_representation(self):
        """Test dataset string representation."""
        self.assertEqual(str(self.dataset), 'Test Dataset')

    def test_dataset_field_creation(self):
        """Test creating a dataset field."""
        field = DatasetField.objects.create(
            dataset=self.dataset,
            name='test_field',
            field_type='STRING',
            description='A test field',
            is_sensitive=True
        )
        
        self.assertEqual(field.dataset, self.dataset)
        self.assertEqual(field.name, 'test_field')
        self.assertEqual(field.field_type, 'STRING')
        self.assertTrue(field.is_sensitive)

    def test_dataset_field_string_representation(self):
        """Test dataset field string representation."""
        field = DatasetField.objects.create(
            dataset=self.dataset,
            name='test_field',
            field_type='STRING'
        )
        
        expected = f'{self.dataset.name}.test_field'
        self.assertEqual(str(field), expected)