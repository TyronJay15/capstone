from django.urls import path

from shared.views import DomainStubView


class ReportsStubView(DomainStubView):
    domain_name = 'reports'


urlpatterns = [
    path('', ReportsStubView.as_view(), name='reports-root'),
]
