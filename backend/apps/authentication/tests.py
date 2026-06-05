from django.urls import reverse
from rest_framework.test import APITestCase

from apps.authentication.models import User
from shared.permissions.roles import Role


class UserManagementViewSetTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username='admin@example.com',
            email='admin@example.com',
            password='password123',
            first_name='Admin',
            last_name='User',
            role=Role.ADMIN,
            is_staff=True,
        )
        self.student = User.objects.create_user(
            username='student@example.com',
            email='student@example.com',
            password='password123',
            first_name='Student',
            last_name='User',
            role=Role.STUDENT,
            student_lrn='2026-001',
        )
        self.teacher = User.objects.create_user(
            username='teacher@example.com',
            email='teacher@example.com',
            password='password123',
            first_name='Teacher',
            last_name='User',
            role=Role.TEACHER,
        )
        self.parent = User.objects.create_user(
            username='parent@example.com',
            email='parent@example.com',
            password='password123',
            first_name='Parent',
            last_name='User',
            role=Role.PARENT,
        )
        self.client.force_authenticate(self.admin)

    def test_admin_account_list_includes_students_teachers_and_parents(self):
        response = self.client.get(reverse('auth-user-list'))

        self.assertEqual(response.status_code, 200)
        rows = response.data['results'] if isinstance(response.data, dict) else response.data
        roles = {row['role'] for row in rows}

        self.assertIn(Role.STUDENT, roles)
        self.assertIn(Role.TEACHER, roles)
        self.assertIn(Role.PARENT, roles)

    def test_admin_account_list_filters_by_role(self):
        response = self.client.get(reverse('auth-user-list'), {'role': Role.TEACHER})

        self.assertEqual(response.status_code, 200)
        rows = response.data['results'] if isinstance(response.data, dict) else response.data

        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]['email'], self.teacher.email)
        self.assertEqual(rows[0]['role'], Role.TEACHER)

    def test_admin_can_deactivate_and_delete_accounts(self):
        detail_url = reverse('auth-user-detail', args=[self.teacher.id])
        response = self.client.patch(detail_url, {'is_active': False}, format='json')

        self.assertEqual(response.status_code, 200)
        self.teacher.refresh_from_db()
        self.assertFalse(self.teacher.is_active)

        response = self.client.delete(reverse('auth-user-detail', args=[self.parent.id]))

        self.assertEqual(response.status_code, 204)
        self.assertFalse(User.objects.filter(id=self.parent.id).exists())

    def test_non_admin_cannot_manage_accounts(self):
        self.client.force_authenticate(self.teacher)

        response = self.client.get(reverse('auth-user-list'))

        self.assertEqual(response.status_code, 403)
