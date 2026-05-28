from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AcademicYearViewSet, CurrentAcademicYearView, EnrollmentViewSet, SectionViewSet

router = DefaultRouter()
router.register('academic-years', AcademicYearViewSet, basename='academic-year')
router.register('sections', SectionViewSet, basename='section')
router.register('', EnrollmentViewSet, basename='enrollment')

urlpatterns = [
    path('current-academic-year/', CurrentAcademicYearView.as_view(), name='current-academic-year'),
    path('', include(router.urls)),
]
