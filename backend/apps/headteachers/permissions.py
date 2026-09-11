from shared.permissions.roles import Role, role_permission_class

IsHeadTeacherOrAdmin = role_permission_class(Role.HEAD_TEACHER, Role.ADMIN)
