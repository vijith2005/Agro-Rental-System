import { profileClient } from "./http";
import { normalizeRole, toBackendRole } from "../utils/auth";

export const getMyProfile = async () => {
  const { data } = await profileClient.get("/profiles/me");
  return data;
};

export const syncMyProfile = async (user) => {
  const { data } = await profileClient.post("/profiles/sync", {
    authUserId: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
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

<<<<<<< HEAD
export const listProfiles = async (params = {}) => {
  const { data } = await profileClient.get("/profiles", { params });
  return data;
};

=======
>>>>>>> origin/main
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
    name: name.trim(),
    phone: phone.trim(),
    address: address?.trim() || "",
    state: state?.trim() || "",
    district: district?.trim() || "",
    farmSize: farmSize?.toString().trim() || "",
    crops: crops?.trim() || "",
  });

  return data;
};
