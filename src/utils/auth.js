export const normalizeRole = (role) => {
  const value = (role || "").toString().trim().toUpperCase();
  if (value === "OWNER") return "owner";
  if (value === "AGENT" || value === "DELIVERY") return "delivery";
  if (value === "ADMIN") return "admin";
  return "farmer";
};

export const toBackendRole = (role) => {
  const normalized = normalizeRole(role);
  if (normalized === "owner") return "OWNER";
  if (normalized === "delivery") return "AGENT";
  if (normalized === "admin") return "ADMIN";
  return "FARMER";
};

export const routeByRole = (role) => {
  const normalized = normalizeRole(role);
  if (normalized === "owner") return "/owner";
  if (normalized === "delivery") return "/delivery";
  if (normalized === "admin") return "/admin";
  return "/farmer";
};

export const mapAuthUserToSessionUser = (user) => ({
  id: user?.id ?? null,
  name: user?.name || "",
  email: user?.email || "",
  phone: user?.phone || "",
  role: normalizeRole(user?.role),
});

export const mergeProfileIntoUser = (user, profile) => ({
  ...user,
  name: profile?.name || user?.name || "",
  email: profile?.email || user?.email || "",
  phone: profile?.phone || user?.phone || "",
  role: normalizeRole(profile?.role || user?.role),
  address: profile?.address || "",
  state: profile?.state || "",
  district: profile?.district || "",
  farmSize: profile?.farmSize || "",
  crops: profile?.crops || "",
  status: profile?.status || user?.status,
});
