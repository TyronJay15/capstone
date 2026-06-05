from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    LoginView,
    ParentLoginView,
    RecaptchaVerifyView,
    RefreshView,
    RegisterStaffView,
    StudentLoginView,
    UserManagementViewSet,
)

router = DefaultRouter()
router.register('users', UserManagementViewSet, basename='auth-user')

urlpatterns = [
    path('login/', LoginView.as_view(), name='auth-login'),
    path('login/student/', StudentLoginView.as_view(), name='auth-login-student'),
    path('login/parent/', ParentLoginView.as_view(), name='auth-login-parent'),
    path('refresh/', RefreshView.as_view(), name='auth-refresh'),
    path('verify-recaptcha/', RecaptchaVerifyView.as_view(), name='auth-verify-recaptcha'),
    path('register/', RegisterStaffView.as_view(), name='auth-register'),
] + router.urls
