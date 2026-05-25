import axios from "axios";
import { getAuthToken } from "./session";

const DEFAULT_PAYMENT_API_URL = "http://localhost:8085/api";

const normalizePaymentBaseUrl = (url) => {
  if (!url) return DEFAULT_PAYMENT_API_URL;
  return String(url).trim().replace(/\/+$/, "").replace(/\/payments$/i, "");
};

export const PAYMENT_API_URL = normalizePaymentBaseUrl(
  import.meta.env.VITE_PAYMENT_API_URL || DEFAULT_PAYMENT_API_URL
);

export const paymentApi = axios.create({
  baseURL: PAYMENT_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

paymentApi.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const paymentAuthHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};
