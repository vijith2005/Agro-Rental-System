import axios from "axios";
import { clearSession, getAuthToken } from "../utils/session";

const authBaseUrl =
  import.meta.env.VITE_AUTH_API_URL || "http://localhost:8081/api/v1";
const profileBaseUrl =
  import.meta.env.VITE_USER_MANAGEMENT_API_URL ||
  "http://localhost:8082/api/v1/user-management";
const equipmentBaseUrl =
  import.meta.env.VITE_EQUIPMENT_API_URL ||
  "http://localhost:8083/api/v1";
const rentalBaseUrl =
  import.meta.env.VITE_RENTAL_API_URL ||
  "http://localhost:8084/api";
const paymentBaseUrl =
  import.meta.env.VITE_PAYMENT_API_URL ||
  "http://localhost:8085/api";

const normalizePaymentBaseUrl = (url) => {
  if (!url) return "http://localhost:8085/api";
  return url.replace(/\/payments\/?$/i, "");
};

const attachAuthInterceptor = (client) => {
  client.interceptors.request.use((config) => {
    const token = getAuthToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error?.response?.status === 401) {
        clearSession();
      }

      return Promise.reject(error);
    }
  );
};

export const authClient = axios.create({
  baseURL: authBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

export const profileClient = axios.create({
  baseURL: profileBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

export const equipmentClient = axios.create({
  baseURL: equipmentBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

export const rentalClient = axios.create({
  baseURL: rentalBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

export const paymentClient = axios.create({
  baseURL: normalizePaymentBaseUrl(paymentBaseUrl),
  headers: {
    "Content-Type": "application/json",
  },
});

attachAuthInterceptor(authClient);
attachAuthInterceptor(profileClient);
attachAuthInterceptor(equipmentClient);
attachAuthInterceptor(rentalClient);
attachAuthInterceptor(paymentClient);

export const getApiErrorMessage = (error, fallbackMessage) => {
  if (error?.response?.data?.fieldErrors) {
    const fieldMessage = Object.values(error.response.data.fieldErrors)[0];
    if (fieldMessage) return fieldMessage;
  }

  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  if (error?.message === "Network Error") {
    return "Cannot connect to the backend server. Please make sure the services are running.";
  }

  return fallbackMessage;
};
