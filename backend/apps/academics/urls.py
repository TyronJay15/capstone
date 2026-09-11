from rest_framework.routers import DefaultRouter

from .views import GradeRecordViewSet, SubjectViewSet, TermViewSet

router = DefaultRouter()
router.register('subjects', SubjectViewSet, basename='subject')
router.register('terms', TermViewSet, basename='term')
router.register('grades', GradeRecordViewSet, basename='grade')

urlpatterns = router.urls
