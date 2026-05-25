import axios from "axios";
import { normalizeRole } from "./auth";
import {
  clearSession,
  getAuthToken,
  getCurrentUser,
  saveSession,
} from "./session";

const DEFAULT_AUTH_API_URL = "http://localhost:8081/api/v1";

const normalizeAuthBaseUrl = (url) =>
  String(url || DEFAULT_AUTH_API_URL)
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/(?:auth|users)$/i, "");

export const AUTH_API_URL = normalizeAuthBaseUrl(import.meta.env.VITE_AUTH_API_URL);

export const authApi = axios.create({
  baseURL: AUTH_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

authApi.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

authApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      clearSession();
    }
    return Promise.reject(error);
  }
);

export const clearAuthSession = clearSession;
export const storeAuthSession = saveSession;
export const readStoredUser = getCurrentUser;
export const readStoredToken = getAuthToken;

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
