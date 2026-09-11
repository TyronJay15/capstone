from rest_framework import serializers

from .models import Announcement, Conversation, Message


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    mine = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ('id', 'sender', 'sender_name', 'body', 'is_read', 'mine', 'created_at')
        read_only_fields = fields

    def get_sender_name(self, obj):
        return obj.sender.get_full_name() or obj.sender.email

    def get_mine(self, obj):
        user = self.context.get('request').user if self.context.get('request') else None
        return bool(user and obj.sender_id == user.id)


class ConversationSerializer(serializers.ModelSerializer):
    other_party_name = serializers.SerializerMethodField()
    other_party_id = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = (
            'id',
            'other_party_id',
            'other_party_name',
            'last_message',
            'unread_count',
            'updated_at',
        )
        read_only_fields = fields

    def _user(self):
        request = self.context.get('request')
        return request.user if request else None

    def get_other_party_name(self, obj):
        user = self._user()
        other = obj.other_party(user) if user else obj.recipient
        return other.get_full_name() or other.email

    def get_other_party_id(self, obj):
        user = self._user()
        other = obj.other_party(user) if user else obj.recipient
        return other.id

    def get_last_message(self, obj):
        msg = obj.messages.last()
        return msg.body if msg else ''

    def get_unread_count(self, obj):
        user = self._user()
        if not user:
            return 0
        return obj.messages.filter(is_read=False).exclude(sender=user).count()


class AnnouncementSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()

    class Meta:
        model = Announcement
        fields = ('id', 'title', 'body', 'author', 'author_name', 'created_at')
        read_only_fields = fields

    def get_author_name(self, obj):
        if obj.author:
            return obj.author.get_full_name() or obj.author.email
        return 'Administration'
