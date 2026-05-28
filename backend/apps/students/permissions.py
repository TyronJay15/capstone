from shared.permissions.roles import Role, role_permission_class

IsStudentUser = role_permission_class(Role.STUDENT)
