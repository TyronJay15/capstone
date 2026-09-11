from shared.permissions.roles import Role, role_permission_class

IsStudent = role_permission_class(Role.STUDENT)
IsParent = role_permission_class(Role.PARENT)
IsTeacher = role_permission_class(Role.TEACHER)
IsAdviser = role_permission_class(Role.ADVISER)
IsHeadTeacher = role_permission_class(Role.HEAD_TEACHER)
IsRegistrar = role_permission_class(Role.REGISTRAR)
IsAdmin = role_permission_class(Role.ADMIN)
IsAcademicStaff = role_permission_class(*Role.ACADEMIC)
IsStaffMember = role_permission_class(*Role.STAFF)
