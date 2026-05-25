import { authClient } from "./http";
import { toBackendRole } from "../utils/auth";

export const registerUser = async ({ name, email, phone, password, role }) => {
  const { data } = await authClient.post("/auth/register", {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: phone.trim(),
    password,
    role: toBackendRole(role),
  });

  return data;
};

export const loginUser = async ({ email, password }) => {
  const { data } = await authClient.post("/auth/login", {
    email: email.trim().toLowerCase(),
    password,
  });

  return data;
};

export const getMyAuthUser = async () => {
  const { data } = await authClient.get("/auth/me");
  return data;
};

<<<<<<< HEAD
export const listUsers = async () => {
  const { data } = await authClient.get("/users");
  return data;
};

=======
>>>>>>> origin/main
export const updateMyAuthUser = async ({ name, email, phone }) => {
  const { data } = await authClient.put("/users/me", {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: phone.trim(),
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
