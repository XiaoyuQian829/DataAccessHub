# apps/accounts/serializers.py

from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import UserProfile

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model."""
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 
                 'employee_id', 'department', 'position', 'phone', 
                 'is_approved', 'created_at']
        read_only_fields = ['id', 'created_at', 'is_approved']

class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for UserProfile model."""
    
    class Meta:
        model = UserProfile
        fields = ['timezone', 'language', 'email_notifications', 
                 'approval_notifications', 'bio']