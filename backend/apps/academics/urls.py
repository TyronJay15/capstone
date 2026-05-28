from rest_framework.routers import DefaultRouter

from .views import GradeRecordViewSet, SemesterViewSet, SubjectViewSet

router = DefaultRouter()
router.register('subjects', SubjectViewSet, basename='subject')
router.register('semesters', SemesterViewSet, basename='semester')
router.register('grades', GradeRecordViewSet, basename='grade')

urlpatterns = router.urls
