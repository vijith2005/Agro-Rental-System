import axios from "axios";
import { normalizeRole } from "./auth";

const DEFAULT_AUTH_API_URL = "http://localhost:8081/api/v1";

export const AUTH_API_URL = import.meta.env.VITE_AUTH_API_URL || DEFAULT_AUTH_API_URL;

export const authApi = axios.create({
  baseURL: AUTH_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const clearAuthSession = () => {
  [
    localStorage,
    sessionStorage,
  ].forEach((storage) => {
    storage.removeItem("currentUser");
    storage.removeItem("user");
    storage.removeItem("agro_token");
  });
};

export const storeAuthSession = (user, token, rememberMe = false) => {
  clearAuthSession();
  const storage = rememberMe ? localStorage : sessionStorage;
  storage.setItem("currentUser", JSON.stringify(user));
  storage.setItem("user", JSON.stringify(user));
  storage.setItem("agro_token", token);
};

export const readStoredUser = () => {
  try {
    return (
      JSON.parse(localStorage.getItem("currentUser")) ||
      JSON.parse(sessionStorage.getItem("currentUser")) ||
      JSON.parse(localStorage.getItem("user")) ||
      JSON.parse(sessionStorage.getItem("user")) ||
      null
    );
  } catch {
    return null;
  }
};

export const readStoredToken = () =>
  localStorage.getItem("agro_token") ||
  sessionStorage.getItem("agro_token") ||
  "";

export const normalizeAuthUser = (user) => {
  if (!user) {
    return null;
  }

  return {
    ...user,
    role: normalizeRole(user.role),
  };
};

export const roleToApiRole = (role) => {
  const normalized = normalizeRole(role);
  if (normalized === "owner") return "OWNER";
  if (normalized === "delivery") return "AGENT";
  if (normalized === "admin") return "ADMIN";
  return "FARMER";
};

export const authErrorMessage = (error, fallback = "Something went wrong") => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data?.fieldErrors && typeof data.fieldErrors === "object") {
      const firstFieldError = Object.values(data.fieldErrors)[0];
      if (firstFieldError) {
        return firstFieldError;
      }
    }
    if (typeof data?.message === "string" && data.message.trim()) {
      return data.message;
    }
    if (typeof data?.error === "string" && data.error.trim()) {
      return data.error;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};
