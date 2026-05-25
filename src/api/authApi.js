import { authClient } from "./http";
import { toBackendRole } from "../utils/auth";

const cleanText = (value) => String(value || "").trim();
const cleanEmail = (value) => cleanText(value).toLowerCase();

export const registerUser = async ({ name, email, phone, password, role }) => {
  const { data } = await authClient.post("/auth/register", {
    name: cleanText(name),
    email: cleanEmail(email),
    phone: cleanText(phone),
    password,
    role: toBackendRole(role),
  });

  return data;
};

export const loginUser = async ({ email, password }) => {
  const { data } = await authClient.post("/auth/login", {
    email: cleanEmail(email),
    password,
  });

  return data;
};

export const getMyAuthUser = async () => {
  const { data } = await authClient.get("/auth/me");
  return data;
};

export const listUsers = async () => {
  const { data } = await authClient.get("/users");
  return data;
};

export const updateMyAuthUser = async ({ name, email, phone }) => {
  const { data } = await authClient.put("/users/me", {
    name: cleanText(name),
    email: cleanEmail(email),
    phone: cleanText(phone),
  });

  return data;
};

export const changeMyPassword = async ({
  currentPassword,
  newPassword,
  confirmPassword,
}) => {
  const { data } = await authClient.put("/users/me/password", {
    currentPassword,
    newPassword,
    confirmPassword,
  });

  return data;
};
