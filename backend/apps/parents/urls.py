from django.urls import path

from .views import ParentChildrenView, ParentLoginHistoryView, ParentProfileView

urlpatterns = [
    path('me/', ParentProfileView.as_view(), name='parent-me'),
    path('children/', ParentChildrenView.as_view(), name='parent-children'),
    path('login-history/', ParentLoginHistoryView.as_view(), name='parent-login-history'),
]
