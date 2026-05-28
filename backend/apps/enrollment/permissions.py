from shared.permissions.roles import Role, role_permission_class

IsRegistrarOrAdmin = role_permission_class(Role.REGISTRAR, Role.ADMIN)
IsStaffEnrollment = role_permission_class(Role.REGISTRAR, Role.ADMIN, Role.TEACHER)
