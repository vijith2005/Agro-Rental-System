const CURRENT_USER_KEY = "currentUser";
const LEGACY_USER_KEY = "user";
const TOKEN_KEY = "agro_token";

export const getCurrentUser = () => {
  try {
    return (
      JSON.parse(localStorage.getItem(CURRENT_USER_KEY)) ||
      JSON.parse(sessionStorage.getItem(CURRENT_USER_KEY)) ||
      JSON.parse(localStorage.getItem(LEGACY_USER_KEY)) ||
      null
    );
  } catch {
    return null;
  }
};

export const getAuthToken = () =>
  localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || "";

export const hasPersistentSession = () => Boolean(localStorage.getItem(TOKEN_KEY));

export const clearSession = () => {
  localStorage.removeItem(CURRENT_USER_KEY);
  sessionStorage.removeItem(CURRENT_USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(LEGACY_USER_KEY);
};

export const saveSession = (user, token, rememberMe = false) => {
  clearSession();

  const storage = rememberMe ? localStorage : sessionStorage;
  storage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  storage.setItem(TOKEN_KEY, token);
  localStorage.setItem(LEGACY_USER_KEY, JSON.stringify(user));
};

export const syncCurrentUser = (updates) => {
  const currentUser = getCurrentUser();
  const nextUser = { ...currentUser, ...updates };

  if (localStorage.getItem(CURRENT_USER_KEY)) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(nextUser));
  }
  if (sessionStorage.getItem(CURRENT_USER_KEY)) {
    sessionStorage.setItem(CURRENT_USER_KEY, JSON.stringify(nextUser));
  }

  localStorage.setItem(LEGACY_USER_KEY, JSON.stringify(nextUser));
  return nextUser;
};

export const pushAuthHistory = (type) => {
  const history = JSON.parse(localStorage.getItem("authHistory")) || [];
  history.push({ type, at: new Date().toISOString() });
  localStorage.setItem("authHistory", JSON.stringify(history));
};
