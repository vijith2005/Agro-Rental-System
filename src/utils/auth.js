export const normalizeRole = (role) => {
  const value = (role || "").toString().trim().toUpperCase();
  if (value === "OWNER") return "owner";
  if (value === "AGENT" || value === "DELIVERY") return "delivery";
  if (value === "ADMIN") return "admin";
  return "farmer";
};

export const routeByRole = (role) => {
  const normalized = normalizeRole(role);
  if (normalized === "owner") return "/owner";
  if (normalized === "delivery") return "/delivery";
  if (normalized === "admin") return "/admin";
  return "/farmer";
};
