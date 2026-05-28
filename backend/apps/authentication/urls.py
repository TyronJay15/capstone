from django.urls import path

from .views import (
    LoginView,
    ParentLoginView,
    RecaptchaVerifyView,
    RefreshView,
    StudentLoginView,
)

urlpatterns = [
    path('login/', LoginView.as_view(), name='auth-login'),
    path('login/student/', StudentLoginView.as_view(), name='auth-login-student'),
    path('login/parent/', ParentLoginView.as_view(), name='auth-login-parent'),
    path('refresh/', RefreshView.as_view(), name='auth-refresh'),
    path('verify-recaptcha/', RecaptchaVerifyView.as_view(), name='auth-verify-recaptcha'),
]
