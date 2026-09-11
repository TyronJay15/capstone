from shared.permissions.roles import Role, role_permission_class

# Staff who may view the section-grouped recommendation summary.
IsRecommendationViewer = role_permission_class(
    Role.ADVISER, Role.HEAD_TEACHER, Role.ADMIN
)
