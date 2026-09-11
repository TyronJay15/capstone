from django.urls import path

from .views import AuditTrailListView

urlpatterns = [
    path('', AuditTrailListView.as_view(), name='audit-list'),
]
