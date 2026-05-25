import React from "react";
import { Navigate } from "react-router-dom";
import { normalizeRole } from "../utils/auth";
import { getAuthToken, getCurrentUser } from "../utils/session";

const ProtectedRoute = ({ children, role }) => {
  const user = getCurrentUser();
  const token = getAuthToken();

  if (!user || !token) {
    return <Navigate to="/login" />;
  }

  if (role && normalizeRole(user.role) !== role) {
    return <Navigate to="/login" />;
  }

  return children;
};

export default ProtectedRoute;
