from django.urls import path

from .views import EnrollmentForecastView

urlpatterns = [
    path('enrollment/', EnrollmentForecastView.as_view(), name='forecast-enrollment'),
]
