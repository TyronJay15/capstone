from django.urls import path

from .views import TeacherAssignmentsView, TeacherRosterView

urlpatterns = [
    path('roster/', TeacherRosterView.as_view(), name='teacher-roster'),
    path('assignments/', TeacherAssignmentsView.as_view(), name='teacher-assignments'),
]
