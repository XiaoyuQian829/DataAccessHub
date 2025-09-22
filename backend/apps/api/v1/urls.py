# apps/api/v1/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from .approvals import ApprovalRequestViewSet, ApprovalStepViewSet
from .datasets import DatasetViewSet, DatasetFieldViewSet
from .permissions import (
    RoleViewSet, UserRoleViewSet, PermissionViewSet, PermissionPolicyViewSet
)
from apps.accounts.views import CurrentUserView

# Create router and register viewsets
router = DefaultRouter()

# Approval endpoints
router.register(r'approvals/requests', ApprovalRequestViewSet, basename='approval-requests')
router.register(r'approvals/steps', ApprovalStepViewSet, basename='approval-steps')

# Dataset endpoints
router.register(r'datasets', DatasetViewSet, basename='datasets')
router.register(r'dataset-fields', DatasetFieldViewSet, basename='dataset-fields')

# Permission endpoints
router.register(r'permissions/roles', RoleViewSet, basename='roles')
router.register(r'permissions/user-roles', UserRoleViewSet, basename='user-roles')
router.register(r'permissions/permissions', PermissionViewSet, basename='permissions')
router.register(r'permissions/policies', PermissionPolicyViewSet, basename='permission-policies')

urlpatterns = [
    # JWT Authentication endpoints
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/user/', CurrentUserView.as_view(), name='current_user'),
    
    # API endpoints
    path('', include(router.urls)),
]