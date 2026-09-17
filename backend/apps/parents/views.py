from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.students.models import ParentStudentLink
from shared.permissions.roles import Role, role_permission_class

from .models import ParentLoginLog, ParentProfile
from .serializers import (
    LinkedChildSerializer,
    ParentLoginLogSerializer,
    ParentProfileSerializer,
    ParentProfileUpdateSerializer,
)

IsParent = role_permission_class(Role.PARENT)
IsParentOrAdmin = role_permission_class(Role.PARENT, Role.ADMIN)


class ParentProfileView(APIView):
    """
    GET  /api/v1/parents/me/  — the authenticated parent's own profile.
    PATCH /api/v1/parents/me/ — update contact-type fields on that profile.

    Scoped entirely to `request.user`: there is no id/lookup parameter, so a
    parent can never address another parent's profile.
    """

    permission_classes = [IsAuthenticated, IsParent]

    def get_object(self, user):
        profile, _ = ParentProfile.objects.get_or_create(user=user)
        return profile

    def get(self, request):
        profile = self.get_object(request.user)
        return Response(ParentProfileSerializer(profile).data)

    def patch(self, request):
        profile = self.get_object(request.user)
        serializer = ParentProfileUpdateSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(ParentProfileSerializer(profile).data, status=status.HTTP_200_OK)


class ParentChildrenView(APIView):
    """
    GET /api/v1/parents/children/
    Lists the student(s) actually linked to the authenticated parent via
    ParentStudentLink. The frontend must resolve which child(ren) it may
    show from this endpoint rather than trusting any LRN passed in a URL
    or query string.
    """

    permission_classes = [IsAuthenticated, IsParent]

    def get(self, request):
        links = (
            ParentStudentLink.objects.filter(parent=request.user)
            .select_related('student', 'student__section', 'student__academic_year')
        )
        children = [LinkedChildSerializer(link.student).data for link in links]
        return Response(children)


class ParentLoginHistoryView(ListAPIView):
    """
    GET /api/v1/parents/login-history/
    A parent sees only their own sign-in history; an admin sees every
    parent's history and may narrow it with ?user=<id>. The queryset is
    scoped by role, so a parent cannot reach another parent's records by
    passing a different id.
    """

    serializer_class = ParentLoginLogSerializer
    permission_classes = [IsAuthenticated, IsParentOrAdmin]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['user', 'parent']

    def get_queryset(self):
        qs = ParentLoginLog.objects.select_related('user', 'parent')
        if self.request.user.role == Role.PARENT:
            return qs.filter(user=self.request.user)
        return qs
