from django.conf import settings
from django.db import models


class Conversation(models.Model):
    """A two-party message thread between an initiator and a recipient."""

    initiator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='conversations_started',
    )
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='conversations_received',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True, db_index=True)

    class Meta:
        db_table = 'notifications_conversations'
        ordering = ['-updated_at']
        constraints = [
            models.UniqueConstraint(
                fields=['initiator', 'recipient'],
                name='unique_conversation_pair',
            ),
        ]

    def __str__(self):
        return f'{self.initiator_id} ↔ {self.recipient_id}'

    def other_party(self, user):
        return self.recipient if self.initiator_id == user.id else self.initiator


class Message(models.Model):
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='messages',
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_messages',
    )
    body = models.TextField()
    is_read = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'notifications_messages'
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['conversation', 'created_at']),
        ]

    def __str__(self):
        return f'{self.sender_id}: {self.body[:32]}'


class Announcement(models.Model):
    """Admin broadcast announcement, read-only for all stakeholders."""

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='announcements',
    )
    title = models.CharField(max_length=160)
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'notifications_announcements'
        ordering = ['-created_at']

    def __str__(self):
        return self.title
