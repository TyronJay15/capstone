from django.urls import path

from .views import (
    AnnouncementView,
    ConversationListView,
    ConversationMessagesView,
    SendMessageView,
)

urlpatterns = [
    path('conversations/', ConversationListView.as_view(), name='conversation-list'),
    path(
        'conversations/<int:conversation_id>/messages/',
        ConversationMessagesView.as_view(),
        name='conversation-messages',
    ),
    path('messages/', SendMessageView.as_view(), name='send-message'),
    path('announcements/', AnnouncementView.as_view(), name='announcements'),
]
