# apps/api/v1/datasets.py

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import serializers
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.db import models

from apps.datasets.models import Dataset, DatasetField, DatasetAccess
from apps.permissions.models import UserRole
from apps.audit.services import log_action

User = get_user_model()

# Serializers
class DatasetFieldSerializer(serializers.ModelSerializer):
    class Meta:
        model = DatasetField
        fields = ['id', 'name', 'field_type', 'sensitivity_level', 'is_required', 'order', 'description']
        read_only_fields = ['id']

class DatasetAccessSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    granted_by_username = serializers.CharField(source='granted_by.username', read_only=True)
    
    class Meta:
        model = DatasetAccess
        fields = ['id', 'user', 'username', 'access_level', 'granted_by', 'granted_by_username', 
                 'granted_at', 'expires_at', 'is_active']
        read_only_fields = ['id', 'username', 'granted_by', 'granted_by_username', 'granted_at']

class DatasetSerializer(serializers.ModelSerializer):
    owner_username = serializers.CharField(source='owner.username', read_only=True)
    fields = DatasetFieldSerializer(many=True, read_only=True)
    access_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Dataset
        fields = ['id', 'name', 'description', 'owner', 'owner_username', 'created_at', 
                 'updated_at', 'is_active', 'fields', 'access_count']
        read_only_fields = ['id', 'owner_username', 'created_at', 'updated_at', 'access_count']

    def get_access_count(self, obj):
        return obj.datasetaccess_set.filter(is_active=True).count()

    def to_representation(self, instance):
        data = super().to_representation(instance)
        user = self.context['request'].user if 'request' in self.context else None
        
        if user and user.is_authenticated:
            user_roles = set(UserRole.objects.filter(user=user, is_active=True).values_list('role__name', flat=True))
            
            # Check if user has access to this dataset
            has_access = DatasetAccess.objects.filter(
                dataset=instance, 
                user=user, 
                is_active=True
            ).exists()
            
            # Filter sensitive fields based on user permissions
            if 'Data Administrator' not in user_roles and not has_access:
                # Hide sensitive field details for users without access
                data['fields'] = [
                    {**field, 'sensitivity_level': '***'} 
                    if field['sensitivity_level'] in ['CONFIDENTIAL', 'RESTRICTED']
                    else field
                    for field in data['fields']
                ]
        
        return data

# ViewSets
class DatasetViewSet(viewsets.ModelViewSet):
    """
    API ViewSet for Dataset management
    
    Provides full CRUD operations for datasets with field-level security
    """
    queryset = Dataset.objects.filter(is_active=True)
    serializer_class = DatasetSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Filter datasets based on user permissions"""
        user = self.request.user
        user_roles = set(UserRole.objects.filter(user=user, is_active=True).values_list('role__name', flat=True))
        
        # Data Administrators can see all datasets
        if 'Data Administrator' in user_roles:
            return Dataset.objects.filter(is_active=True)
        
        # Users can see datasets they own or have access to
        return Dataset.objects.filter(
            models.Q(owner=user) | 
            models.Q(datasetaccess__user=user, datasetaccess__is_active=True),
            is_active=True
        ).distinct()

    def perform_create(self, serializer):
        """Set owner to current user when creating dataset"""
        dataset = serializer.save(owner=self.request.user)
        log_action(self.request.user, 'CREATE', dataset, {'name': dataset.name})

    def perform_update(self, serializer):
        dataset = serializer.save()
        log_action(self.request.user, 'UPDATE', dataset, {'name': dataset.name})

    def perform_destroy(self, instance):
        """Soft delete dataset"""
        instance.is_active = False
        instance.save()
        log_action(self.request.user, 'DELETE', instance, {'name': instance.name})

    @action(detail=True, methods=['post'])
    def grant_access(self, request, pk=None):
        """Grant user access to dataset"""
        dataset = self.get_object()
        user_id = request.data.get('user_id')
        access_level = request.data.get('access_level', 'READ')
        expires_at = request.data.get('expires_at')
        
        if not user_id:
            return Response(
                {'error': 'user_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            target_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if user has permission to grant access
        user_roles = set(UserRole.objects.filter(user=request.user, is_active=True).values_list('role__name', flat=True))
        if 'Data Administrator' not in user_roles and dataset.owner != request.user:
            return Response(
                {'error': 'Permission denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Create or update access
        access, created = DatasetAccess.objects.update_or_create(
            dataset=dataset,
            user=target_user,
            defaults={
                'access_level': access_level,
                'granted_by': request.user,
                'expires_at': expires_at,
                'is_active': True
            }
        )
        
        serializer = DatasetAccessSerializer(access)
        log_action(request.user, 'GRANT_ACCESS', dataset, {
            'target_user': target_user.username,
            'access_level': access_level
        })
        
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    @action(detail=True, methods=['delete'])
    def revoke_access(self, request, pk=None):
        """Revoke user access to dataset"""
        dataset = self.get_object()
        user_id = request.data.get('user_id')
        
        if not user_id:
            return Response(
                {'error': 'user_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            access = DatasetAccess.objects.get(
                dataset=dataset, 
                user_id=user_id, 
                is_active=True
            )
        except DatasetAccess.DoesNotExist:
            return Response(
                {'error': 'Access not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check permission
        user_roles = set(UserRole.objects.filter(user=request.user, is_active=True).values_list('role__name', flat=True))
        if 'Data Administrator' not in user_roles and dataset.owner != request.user:
            return Response(
                {'error': 'Permission denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        access.is_active = False
        access.save()
        
        log_action(request.user, 'REVOKE_ACCESS', dataset, {
            'target_user': access.user.username
        })
        
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['get'])
    def access_list(self, request, pk=None):
        """List users with access to dataset"""
        dataset = self.get_object()
        
        # Check permission
        user_roles = set(UserRole.objects.filter(user=request.user, is_active=True).values_list('role__name', flat=True))
        if 'Data Administrator' not in user_roles and dataset.owner != request.user:
            return Response(
                {'error': 'Permission denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        accesses = DatasetAccess.objects.filter(dataset=dataset, is_active=True)
        serializer = DatasetAccessSerializer(accesses, many=True)
        return Response(serializer.data)

class DatasetFieldViewSet(viewsets.ModelViewSet):
    """
    API ViewSet for DatasetField management
    
    Manages field definitions and sensitivity levels
    """
    queryset = DatasetField.objects.all()
    serializer_class = DatasetFieldSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Filter fields based on dataset access"""
        user = self.request.user
        user_roles = set(UserRole.objects.filter(user=user, is_active=True).values_list('role__name', flat=True))
        
        # Data Administrators can see all fields
        if 'Data Administrator' in user_roles:
            return DatasetField.objects.all()
        
        # Users can see fields for datasets they own or have access to
        return DatasetField.objects.filter(
            models.Q(dataset__owner=user) | 
            models.Q(dataset__datasetaccess__user=user, dataset__datasetaccess__is_active=True)
        ).distinct()

    def perform_create(self, serializer):
        field = serializer.save()
        log_action(self.request.user, 'CREATE', field, {'name': field.name})

    def perform_update(self, serializer):
        field = serializer.save()
        log_action(self.request.user, 'UPDATE', field, {'name': field.name})

    def perform_destroy(self, instance):
        log_action(self.request.user, 'DELETE', instance, {'name': instance.name})
        instance.delete()