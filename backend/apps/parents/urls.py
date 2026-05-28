from django.urls import path

from shared.views import DomainStubView


class ParentsStubView(DomainStubView):
    domain_name = 'parents'


urlpatterns = [
    path('', ParentsStubView.as_view(), name='parents-root'),
]
