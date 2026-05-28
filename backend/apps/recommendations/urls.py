from django.urls import path

from shared.views import DomainStubView


class RecommendationsStubView(DomainStubView):
    domain_name = 'recommendations'


urlpatterns = [
    path('', RecommendationsStubView.as_view(), name='recommendations-root'),
]
