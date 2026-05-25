import axios from "axios";
import { readStoredToken } from "./authApi";

const DEFAULT_PAYMENT_API_URL = "http://localhost:8085/api";

const normalizePaymentBaseUrl = (url) => {
  if (!url) return DEFAULT_PAYMENT_API_URL;
  return url.replace(/\/payments\/?$/i, "");
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

export const paymentAuthHeaders = () => {
  const token = readStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};
