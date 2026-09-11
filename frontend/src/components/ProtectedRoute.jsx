import React from 'react';
import { Navigate } from 'react-router-dom';
import { getSession, ROLE_HOME_ROUTES } from '../services/auth';

const ProtectedRoute = ({ allowedRoles, children }) => {
  const { role } = getSession();

  // Not signed in → go to login.
  if (!role) {
    return <Navigate to="/login" replace />;
  }

  // Signed in but this route isn't for their role → send them to their own
  // dashboard (access is decided purely by the authenticated `role` field).
  if (allowedRoles && !allowedRoles.includes(role)) {
    const fallback = ROLE_HOME_ROUTES[role] || '/login';
    return <Navigate to={fallback} replace />;
  }

  return children;
};

export default ProtectedRoute;
