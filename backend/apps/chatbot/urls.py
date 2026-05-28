from django.urls import path

from shared.views import DomainStubView


class ChatbotStubView(DomainStubView):
    domain_name = 'chatbot'


urlpatterns = [
    path('', ChatbotStubView.as_view(), name='chatbot-root'),
]
