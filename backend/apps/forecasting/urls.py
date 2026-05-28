from django.urls import path

from shared.views import DomainStubView


class ForecastingStubView(DomainStubView):
    domain_name = 'forecasting'


urlpatterns = [
    path('', ForecastingStubView.as_view(), name='forecasting-root'),
]
