import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { ROUTES } from "../../constants/constants";

/**
 * ProtectedRoute
 * Ensures:
 * - User is authenticated
 * - Access token exists
 * - Role-based authorization
 * - Session auto-refresh does not cause premature redirect
 */
const ProtectedRoute = ({ children, roles }) => {
  const { user, token, isAuthenticated, checking } = useAuth();

  /* ---------------------------------------------------------
     1. While auth is checking (startup, refresh flow)
     Prevents incorrect redirects during boot.
  ---------------------------------------------------------- */
  if (checking) {
    return (
      <div className="w-full h-screen flex items-center justify-center text-gray-700 text-lg">
        Verifying session...
      </div>
    );
  }

  /* ---------------------------------------------------------
     2. No token → must login
     Token is authoritative for access (refresh in cookie).
  ---------------------------------------------------------- */
  if (!isAuthenticated || !token) {
    return <Navigate to={ROUTES.AUTH.LOGIN} replace />;
  }

  /* ---------------------------------------------------------
     3. Role-based access control
     roles = ["ADMIN", "TEACHER"] etc.
  ---------------------------------------------------------- */
  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to={ROUTES.AUTH.LOGIN} replace />;
  }

  /* ---------------------------------------------------------
     4. Authorized → render children
  ---------------------------------------------------------- */
  return children;
};

export default React.memo(ProtectedRoute);
