from shared.permissions.roles import Role, role_permission_class

IsStudent = role_permission_class(Role.STUDENT)
IsParent = role_permission_class(Role.PARENT)
IsTeacher = role_permission_class(Role.TEACHER)
IsRegistrar = role_permission_class(Role.REGISTRAR)
IsAdmin = role_permission_class(Role.ADMIN)
IsStaffMember = role_permission_class(*Role.STAFF, Role.REGISTRAR)
