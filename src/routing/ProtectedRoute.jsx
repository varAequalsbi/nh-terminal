import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { hasRole } from '../auth/session';
import { StateScreen } from '../components/Common/AsyncStates';

export default function ProtectedRoute({ session, roles, children }) {
  const location = useLocation();
  if (!session) return <Navigate to="/login" replace state={{ from: location }} />;
  if (!hasRole(session, roles)) return <StateScreen state="forbidden" />;
  return children;
}
