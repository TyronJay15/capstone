from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import StudentDashboardView, StudentProfileViewSet

router = DefaultRouter()
router.register('', StudentProfileViewSet, basename='student')

urlpatterns = [
    path('dashboard/', StudentDashboardView.as_view(), name='student-dashboard'),
    path('', include(router.urls)),
]
