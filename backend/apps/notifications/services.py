"""Conversation + messaging rules and helpers.

Messaging permission matrix (Phase 5A):
- Adviser     → students in their advisory section(s).
- Subject Teacher → students in their assigned section(s) + the adviser of those sections.
- Student     → reply only to their adviser and assigned subject teachers.
- Parent      → read-only (cannot send).
- Admin       → broadcasts via announcements; may also message any staff.
- Head Teacher → may message any active staff member.
"""
from django.db.models import Q

from apps.headteachers.models import AdviserAssignment
from apps.students.models import StudentProfile
from apps.teachers.models import TeacherAssignment
from shared.permissions.roles import Role

from .models import Conversation, Message


class NotificationError(Exception):
    def __init__(self, message, code='notification_error'):
        self.message = message
        self.code = code
        super().__init__(message)


def _student_profile_for(user):
    if user.role != Role.STUDENT:
        return None
    lrn = user.student_lrn
    if not lrn:
        return None
    return (
        StudentProfile.objects.select_related('section')
        .filter(lrn=lrn, is_active=True)
        .first()
    )


def _section_ids_advised_by(user):
    return set(
        AdviserAssignment.objects.filter(adviser=user).values_list('section_id', flat=True)
    )


def _section_ids_taught_by(user):
    return set(
        TeacherAssignment.objects.filter(teacher=user, section__isnull=False).values_list(
            'section_id', flat=True
        )
    )


def _adviser_user_ids_for_section(section_id):
    return set(
        AdviserAssignment.objects.filter(section_id=section_id).values_list(
            'adviser_id', flat=True
        )
    )


def can_message(sender, recipient):
    """Whether ``sender`` is permitted to message ``recipient``."""
    if sender.id == recipient.id:
        return False
    if sender.role == Role.PARENT:
        return False

    if sender.role == Role.ADMIN or sender.is_superuser:
        return True

    if sender.role == Role.HEAD_TEACHER:
        return recipient.role in Role.STAFF

    if sender.role == Role.ADVISER:
        if recipient.role != Role.STUDENT:
            return False
        profile = _student_profile_for(recipient)
        return bool(profile and profile.section_id in _section_ids_advised_by(sender))

    if sender.role == Role.TEACHER:
        taught = _section_ids_taught_by(sender)
        if recipient.role == Role.STUDENT:
            profile = _student_profile_for(recipient)
            return bool(profile and profile.section_id in taught)
        if recipient.role in (Role.ADVISER, Role.HEAD_TEACHER):
            # Adviser of a section the teacher teaches.
            return any(
                recipient.id in _adviser_user_ids_for_section(sid) for sid in taught
            )
        return False

    if sender.role == Role.STUDENT:
        profile = _student_profile_for(sender)
        if not profile or not profile.section_id:
            return False
        # Reply to adviser of own section…
        if recipient.id in _adviser_user_ids_for_section(profile.section_id):
            return True
        # …or to a subject teacher assigned to own section.
        return TeacherAssignment.objects.filter(
            teacher=recipient, section_id=profile.section_id
        ).exists()

    return False


def get_or_create_conversation(user_a, user_b):
    convo = Conversation.objects.filter(
        Q(initiator=user_a, recipient=user_b) | Q(initiator=user_b, recipient=user_a)
    ).first()
    if convo:
        return convo
    return Conversation.objects.create(initiator=user_a, recipient=user_b)


def send_message(sender, recipient, body):
    body = (body or '').strip()
    if not body:
        raise NotificationError('Message body is required.', code='empty_body')
    if not can_message(sender, recipient):
        raise NotificationError(
            'You are not allowed to message this recipient.', code='not_allowed'
        )
    convo = get_or_create_conversation(sender, recipient)
    convo.save(update_fields=['updated_at'])  # bump ordering
    return Message.objects.create(conversation=convo, sender=sender, body=body)


def list_conversations(user):
    return (
        Conversation.objects.filter(Q(initiator=user) | Q(recipient=user))
        .select_related('initiator', 'recipient')
        .prefetch_related('messages')
    )


def get_conversation_messages(user, conversation):
    # Mark unread messages addressed to this user as read.
    Message.objects.filter(conversation=conversation, is_read=False).exclude(
        sender=user
    ).update(is_read=True)
    return conversation.messages.select_related('sender').all()
