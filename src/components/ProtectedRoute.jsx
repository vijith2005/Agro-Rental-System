import React from "react";
import { Navigate } from "react-router-dom";
import { normalizeRole } from "../utils/auth";

const ProtectedRoute = ({ children, role }) => {
  const user =
    JSON.parse(localStorage.getItem("currentUser")) ||
    JSON.parse(sessionStorage.getItem("currentUser"));
  const token = localStorage.getItem("agro_token") || sessionStorage.getItem("agro_token");

  if (!user || !token) {
    return <Navigate to="/login" />;
  }

  if (role && normalizeRole(user.role) !== role) {
    return <Navigate to="/login" />;
  }

  return children;
};

export default ProtectedRoute;
