import { profileClient } from "./http";
import { normalizeRole, toBackendRole } from "../utils/auth";

const cleanText = (value) => String(value || "").trim();

export const getMyProfile = async () => {
  const { data } = await profileClient.get("/profiles/me");
  return data;
};

export const syncMyProfile = async (user) => {
  const { data } = await profileClient.post("/profiles/sync", {
    authUserId: user.id,
    name: cleanText(user.name),
    email: cleanText(user.email).toLowerCase(),
    phone: cleanText(user.phone),
    role: toBackendRole(user.role),
  });

  return data;
};

export const ensureMyProfile = async (user) => {
  try {
    return await getMyProfile();
  } catch (error) {
    if (error?.response?.status !== 404 || !user?.id) {
      throw error;
    }

    await syncMyProfile({
      ...user,
      role: normalizeRole(user.role),
    });

    return getMyProfile();
  }
};

export const listProfiles = async (params = {}) => {
  const { data } = await profileClient.get("/profiles", { params });
  return data;
};

export const updateMyProfile = async ({
  name,
  phone,
  address,
  state,
  district,
  farmSize,
  crops,
}) => {
  const { data } = await profileClient.put("/profiles/me", {
    name: cleanText(name),
    phone: cleanText(phone),
    address: cleanText(address),
    state: cleanText(state),
    district: cleanText(district),
    farmSize: farmSize?.toString().trim() || "",
    crops: cleanText(crops),
  });

  return data;
};
