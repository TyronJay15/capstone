import React from 'react';
import { Navigate } from 'react-router-dom';
import { getSession } from '../services/auth';

const ProtectedRoute = ({ allowedRoles, children }) => {
  const { role } = getSession();

  if (!role) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    const fallback = {
      student: '/dashboard',
      parent: '/dashboard',
      registrar: '/registrar',
      admin: '/admin',
      teacher: '/teacher'
    }[role];
    return <Navigate to={fallback || '/login'} replace />;
  }

  return children;
};

export default ProtectedRoute;
