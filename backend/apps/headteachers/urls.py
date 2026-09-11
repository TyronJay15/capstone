from django.urls import path

from .views import (
    AssignAdviserView,
    AssignSubjectTeacherView,
    SectionCreateView,
    SectionSummaryView,
    TeacherDirectoryView,
)

urlpatterns = [
    path('teachers/', TeacherDirectoryView.as_view(), name='ht-teacher-directory'),
    path('assign-adviser/', AssignAdviserView.as_view(), name='ht-assign-adviser'),
    path('assign-subject-teacher/', AssignSubjectTeacherView.as_view(), name='ht-assign-subject-teacher'),
    path('sections/', SectionCreateView.as_view(), name='ht-section-create'),
    path('sections/summary/', SectionSummaryView.as_view(), name='ht-section-summary'),
]
