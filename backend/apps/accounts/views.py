# apps/accounts/views.py

from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model

from .models import UserProfile
from .serializers import UserSerializer, UserProfileSerializer

User = get_user_model()

"""API-only views for accounts app."""

# API views
class UserListCreateAPIView(generics.ListCreateAPIView):
    """API view for listing and creating users."""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.has_permission('USER_MANAGE'):
            return User.objects.all()
        return User.objects.filter(id=self.request.user.id)

class UserRetrieveUpdateAPIView(generics.RetrieveUpdateAPIView):
    """API view for retrieving and updating user details."""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        if self.kwargs.get('pk') == 'me':
            return self.request.user
        return super().get_object()

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def user_profile_api(request):
    """API endpoint for user profile."""
    profile, created = UserProfile.objects.get_or_create(user=request.user)
    
    if request.method == 'GET':
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = UserProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def approve_user(request, user_id):
    """API endpoint to approve user registration."""
    if not request.user.has_permission('USER_MANAGE'):
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        user = get_object_or_404(User, id=user_id)
        user.is_approved = True
        user.approved_by = request.user
        user.save()
        
        return Response({'message': f'User {user.username} approved successfully'})
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

class CurrentUserView(APIView):
    """API view to get current user information"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        # Add roles information
        user_data = serializer.data
        user_data['roles'] = [role.name for role in request.user.roles.all()] if hasattr(request.user, 'roles') else []
        return Response(user_data)
