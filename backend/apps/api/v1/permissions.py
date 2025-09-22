# apps/api/v1/permissions.py

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import serializers
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model

from apps.permissions.models import Role, Permission, UserRole, RolePermission, PermissionPolicy
from apps.audit.services import log_action

User = get_user_model()

# Serializers
class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ['id', 'name', 'permission_type', 'description']
        read_only_fields = ['id']

class RoleSerializer(serializers.ModelSerializer):
    permission_count = serializers.SerializerMethodField()
    permissions = PermissionSerializer(many=True, read_only=True)
    
    class Meta:
        model = Role
        fields = ['id', 'name', 'description', 'is_active', 'created_at', 'permissions', 'permission_count']
        read_only_fields = ['id', 'created_at', 'permission_count']

    def get_permission_count(self, obj):
        return obj.permissions.count()

class UserRoleSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    role_name = serializers.CharField(source='role.name', read_only=True)
    assigned_by_username = serializers.CharField(source='assigned_by.username', read_only=True)
    
    class Meta:
        model = UserRole
        fields = ['id', 'user', 'username', 'role', 'role_name', 'assigned_by', 
                 'assigned_by_username', 'assigned_at', 'expires_at', 'is_active']
        read_only_fields = ['id', 'username', 'role_name', 'assigned_by', 'assigned_by_username', 'assigned_at']

class RolePermissionSerializer(serializers.ModelSerializer):
    role_name = serializers.CharField(source='role.name', read_only=True)
    permission_name = serializers.CharField(source='permission.name', read_only=True)
    
    class Meta:
        model = RolePermission
        fields = ['id', 'role', 'role_name', 'permission', 'permission_name', 'granted_at']
        read_only_fields = ['id', 'role_name', 'permission_name', 'granted_at']

class PermissionPolicySerializer(serializers.ModelSerializer):
    class Meta:
        model = PermissionPolicy
        fields = ['id', 'name', 'resource_type', 'conditions', 'actions', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']

# ViewSets
class RoleViewSet(viewsets.ModelViewSet):
    """
    API ViewSet for Role management
    
    Manages roles and their associated permissions
    """
    queryset = Role.objects.filter(is_active=True)
    serializer_class = RoleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Filter roles based on user permissions"""
        user = self.request.user
        user_roles = set(UserRole.objects.filter(user=user, is_active=True).values_list('role__name', flat=True))
        
        # Only Data Administrators can manage roles
        if 'Data Administrator' in user_roles:
            return Role.objects.filter(is_active=True)
        
        # Other users can only view their own roles
        return Role.objects.filter(
            userrole__user=user,
            userrole__is_active=True,
            is_active=True
        ).distinct()

    def perform_create(self, serializer):
        """Check permission to create roles"""
        user_roles = set(UserRole.objects.filter(user=self.request.user, is_active=True).values_list('role__name', flat=True))
        if 'Data Administrator' not in user_roles:
            raise PermissionError("Only Data Administrators can create roles")
        
        role = serializer.save()
        log_action(self.request.user, 'CREATE', role, {'name': role.name})

    def perform_update(self, serializer):
        """Check permission to update roles"""
        user_roles = set(UserRole.objects.filter(user=self.request.user, is_active=True).values_list('role__name', flat=True))
        if 'Data Administrator' not in user_roles:
            raise PermissionError("Only Data Administrators can update roles")
        
        role = serializer.save()
        log_action(self.request.user, 'UPDATE', role, {'name': role.name})

    def perform_destroy(self, instance):
        """Soft delete role"""
        user_roles = set(UserRole.objects.filter(user=self.request.user, is_active=True).values_list('role__name', flat=True))
        if 'Data Administrator' not in user_roles:
            raise PermissionError("Only Data Administrators can delete roles")
        
        instance.is_active = False
        instance.save()
        log_action(self.request.user, 'DELETE', instance, {'name': instance.name})

    @action(detail=True, methods=['post'])
    def add_permission(self, request, pk=None):
        """Add permission to role"""
        role = self.get_object()
        permission_id = request.data.get('permission_id')
        
        user_roles = set(UserRole.objects.filter(user=request.user, is_active=True).values_list('role__name', flat=True))
        if 'Data Administrator' not in user_roles:
            return Response(
                {'error': 'Only Data Administrators can manage role permissions'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        if not permission_id:
            return Response(
                {'error': 'permission_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            permission = Permission.objects.get(id=permission_id)
        except Permission.DoesNotExist:
            return Response(
                {'error': 'Permission not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        role_permission, created = RolePermission.objects.get_or_create(
            role=role,
            permission=permission
        )
        
        serializer = RolePermissionSerializer(role_permission)
        log_action(request.user, 'ADD_PERMISSION', role, {
            'permission': permission.name
        })
        
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    @action(detail=True, methods=['delete'])
    def remove_permission(self, request, pk=None):
        """Remove permission from role"""
        role = self.get_object()
        permission_id = request.data.get('permission_id')
        
        user_roles = set(UserRole.objects.filter(user=request.user, is_active=True).values_list('role__name', flat=True))
        if 'Data Administrator' not in user_roles:
            return Response(
                {'error': 'Only Data Administrators can manage role permissions'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        if not permission_id:
            return Response(
                {'error': 'permission_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            role_permission = RolePermission.objects.get(
                role=role, 
                permission_id=permission_id
            )
        except RolePermission.DoesNotExist:
            return Response(
                {'error': 'Role permission not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        permission_name = role_permission.permission.name
        role_permission.delete()
        
        log_action(request.user, 'REMOVE_PERMISSION', role, {
            'permission': permission_name
        })
        
        return Response(status=status.HTTP_204_NO_CONTENT)

class UserRoleViewSet(viewsets.ModelViewSet):
    """
    API ViewSet for UserRole management
    
    Manages user role assignments
    """
    queryset = UserRole.objects.filter(is_active=True)
    serializer_class = UserRoleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Filter user roles based on permissions"""
        user = self.request.user
        user_roles = set(UserRole.objects.filter(user=user, is_active=True).values_list('role__name', flat=True))
        
        # Data Administrators can see all user roles
        if 'Data Administrator' in user_roles:
            return UserRole.objects.filter(is_active=True)
        
        # Users can only see their own roles
        return UserRole.objects.filter(user=user, is_active=True)

    def perform_create(self, serializer):
        """Check permission to assign roles"""
        user_roles = set(UserRole.objects.filter(user=self.request.user, is_active=True).values_list('role__name', flat=True))
        if 'Data Administrator' not in user_roles:
            raise PermissionError("Only Data Administrators can assign roles")
        
        user_role = serializer.save(assigned_by=self.request.user)
        log_action(self.request.user, 'ASSIGN_ROLE', user_role.user, {
            'role': user_role.role.name
        })

    def perform_destroy(self, instance):
        """Revoke user role"""
        user_roles = set(UserRole.objects.filter(user=self.request.user, is_active=True).values_list('role__name', flat=True))
        if 'Data Administrator' not in user_roles:
            raise PermissionError("Only Data Administrators can revoke roles")
        
        instance.is_active = False
        instance.save()
        log_action(self.request.user, 'REVOKE_ROLE', instance.user, {
            'role': instance.role.name
        })

class PermissionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only API ViewSet for Permission
    
    Lists available permissions in the system
    """
    queryset = Permission.objects.all()
    serializer_class = PermissionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Only Data Administrators can see all permissions"""
        user_roles = set(UserRole.objects.filter(user=self.request.user, is_active=True).values_list('role__name', flat=True))
        
        if 'Data Administrator' in user_roles:
            return Permission.objects.all()
        
        # Other users can only see their permissions
        return Permission.objects.filter(
            rolepermission__role__userrole__user=self.request.user,
            rolepermission__role__userrole__is_active=True
        ).distinct()

class PermissionPolicyViewSet(viewsets.ModelViewSet):
    """
    API ViewSet for PermissionPolicy management
    
    Manages policy-based permission rules
    """
    queryset = PermissionPolicy.objects.filter(is_active=True)
    serializer_class = PermissionPolicySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Only Data Administrators can manage policies"""
        user_roles = set(UserRole.objects.filter(user=self.request.user, is_active=True).values_list('role__name', flat=True))
        
        if 'Data Administrator' in user_roles:
            return PermissionPolicy.objects.filter(is_active=True)
        
        return PermissionPolicy.objects.none()

    def perform_create(self, serializer):
        """Check permission to create policies"""
        user_roles = set(UserRole.objects.filter(user=self.request.user, is_active=True).values_list('role__name', flat=True))
        if 'Data Administrator' not in user_roles:
            raise PermissionError("Only Data Administrators can create policies")
        
        policy = serializer.save()
        log_action(self.request.user, 'CREATE', policy, {'name': policy.name})

    def perform_update(self, serializer):
        """Check permission to update policies"""
        user_roles = set(UserRole.objects.filter(user=self.request.user, is_active=True).values_list('role__name', flat=True))
        if 'Data Administrator' not in user_roles:
            raise PermissionError("Only Data Administrators can update policies")
        
        policy = serializer.save()
        log_action(self.request.user, 'UPDATE', policy, {'name': policy.name})

    def perform_destroy(self, instance):
        """Soft delete policy"""
        user_roles = set(UserRole.objects.filter(user=self.request.user, is_active=True).values_list('role__name', flat=True))
        if 'Data Administrator' not in user_roles:
            raise PermissionError("Only Data Administrators can delete policies")
        
        instance.is_active = False
        instance.save()
        log_action(self.request.user, 'DELETE', instance, {'name': instance.name})