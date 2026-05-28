from django.core.management.base import BaseCommand

from apps.authentication.models import User
from shared.permissions.roles import Role

STAFF = [
    ('registrar@dampol.edu.ph', Role.REGISTRAR, 'Registrar'),
    ('admin@dampol.edu.ph', Role.ADMIN, 'Admin'),
    ('teacher@dampol.edu.ph', Role.TEACHER, 'Teacher'),
    ('parent@dampol.edu.ph', Role.PARENT, 'Parent'),
]


class Command(BaseCommand):
    help = 'Create demo staff accounts (development only).'

    def add_arguments(self, parser):
        parser.add_argument(
            '--password',
            default='changeme123',
            help='Password for all demo staff accounts',
        )

    def handle(self, *args, **options):
        password = options['password']
        for email, role, first in STAFF:
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': email,
                    'first_name': first,
                    'last_name': 'Demo',
                    'role': role,
                    'is_staff': role in (Role.ADMIN, Role.REGISTRAR),
                },
            )
            if created or user.check_password(password) is False:
                user.set_password(password)
                user.role = role
                user.save()
                self.stdout.write(f'{"Created" if created else "Updated"} {email} ({role})')
        self.stdout.write(self.style.WARNING('Use only in development. Change passwords before production.'))
