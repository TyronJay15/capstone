from django.urls import path

from .views import TeacherAssignmentsView, TeacherLoginHistoryView, TeacherRosterView

urlpatterns = [
    path('roster/', TeacherRosterView.as_view(), name='teacher-roster'),
    path('assignments/', TeacherAssignmentsView.as_view(), name='teacher-assignments'),
    path('login-history/', TeacherLoginHistoryView.as_view(), name='teacher-login-history'),
]
