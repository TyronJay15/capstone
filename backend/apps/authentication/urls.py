from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    ChangePasswordView,
    LoginActivityListView,
    LoginView,
    LogoutView,
    ParentLoginView,
    RecaptchaVerifyView,
    RefreshView,
    RegisterStaffView,
    StudentLoginView,
    UserManagementViewSet,
    UserStatisticsView,
)

router = DefaultRouter()
router.register('users', UserManagementViewSet, basename='auth-user')

urlpatterns = [
    path('login/', LoginView.as_view(), name='auth-login'),
    path('login/student/', StudentLoginView.as_view(), name='auth-login-student'),
    path('login/parent/', ParentLoginView.as_view(), name='auth-login-parent'),
    path('refresh/', RefreshView.as_view(), name='auth-refresh'),
    path('logout/', LogoutView.as_view(), name='auth-logout'),
    path('change-password/', ChangePasswordView.as_view(), name='auth-change-password'),
    path('statistics/', UserStatisticsView.as_view(), name='auth-statistics'),
    path('login-activity/', LoginActivityListView.as_view(), name='auth-login-activity'),
    path('verify-recaptcha/', RecaptchaVerifyView.as_view(), name='auth-verify-recaptcha'),
    path('register/', RegisterStaffView.as_view(), name='auth-register'),
] + router.urls
