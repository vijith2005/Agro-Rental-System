import React from "react";
import { Navigate } from "react-router-dom";
import { normalizeRole } from "../utils/auth";
import { readStoredToken, readStoredUser } from "../utils/authApi";

const ProtectedRoute = ({ children, role }) => {
  const user = readStoredUser();
  const token = readStoredToken();

  if (!user || !token) {
    return <Navigate to="/login" />;
  }

  if (role && normalizeRole(user.role) !== role) {
    return <Navigate to="/login" />;
  }

  return children;
};

export default ProtectedRoute;
