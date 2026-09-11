from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from shared.permissions.roles import Role

from .models import Announcement, Conversation
from .serializers import (
    AnnouncementSerializer,
    ConversationSerializer,
    MessageSerializer,
)
from .services import (
    NotificationError,
    get_conversation_messages,
    list_conversations,
    send_message,
)

User = get_user_model()


class ConversationListView(APIView):
    """GET /api/v1/notifications/conversations/ — current user's threads."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        convos = list_conversations(request.user)
        return Response(
            ConversationSerializer(convos, many=True, context={'request': request}).data
        )


class ConversationMessagesView(APIView):
    """GET /api/v1/notifications/conversations/<id>/messages/ — thread + mark read."""

    permission_classes = [IsAuthenticated]

    def get(self, request, conversation_id):
        convo = Conversation.objects.filter(id=conversation_id).first()
        if not convo or request.user.id not in (convo.initiator_id, convo.recipient_id):
            return Response({'detail': 'Conversation not found.'}, status=status.HTTP_404_NOT_FOUND)
        messages = get_conversation_messages(request.user, convo)
        return Response(
            MessageSerializer(messages, many=True, context={'request': request}).data
        )


class SendMessageView(APIView):
    """POST /api/v1/notifications/messages/ {recipient_id, body}."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        recipient = User.objects.filter(
            id=request.data.get('recipient_id'), is_active=True
        ).first()
        if not recipient:
            return Response({'detail': 'Recipient not found.'}, status=status.HTTP_404_NOT_FOUND)
        try:
            message = send_message(request.user, recipient, request.data.get('body'))
        except NotificationError as exc:
            code = status.HTTP_403_FORBIDDEN if exc.code == 'not_allowed' else status.HTTP_400_BAD_REQUEST
            return Response({'detail': exc.message, 'code': exc.code}, status=code)
        return Response(
            MessageSerializer(message, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


class AnnouncementView(APIView):
    """GET (all) / POST (admin) /api/v1/notifications/announcements/."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        announcements = Announcement.objects.all()
        return Response(AnnouncementSerializer(announcements, many=True).data)

    def post(self, request):
        if request.user.role != Role.ADMIN and not request.user.is_superuser:
            return Response(
                {'detail': 'Only admins can broadcast announcements.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        title = (request.data.get('title') or '').strip()
        body = (request.data.get('body') or '').strip()
        if not title or not body:
            return Response(
                {'detail': 'Title and body are required.'}, status=status.HTTP_400_BAD_REQUEST
            )
        announcement = Announcement.objects.create(
            author=request.user, title=title, body=body
        )
        return Response(
            AnnouncementSerializer(announcement).data, status=status.HTTP_201_CREATED
        )
