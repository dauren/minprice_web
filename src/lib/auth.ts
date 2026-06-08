// JWT token storage for authenticated users (Telegram / Google login).
// Tokens live in localStorage; guest identity (guest_uuid) is handled separately in api.ts.

const ACCESS_KEY = "minprice_access_token";
const REFRESH_KEY = "minprice_refresh_token";

export interface AuthTokens {
  access: string;
  refresh: string;
}

export const getAccessToken = (): string | null => localStorage.getItem(ACCESS_KEY);

export const getRefreshToken = (): string | null => localStorage.getItem(REFRESH_KEY);

export const setTokens = ({ access, refresh }: AuthTokens) => {
  localStorage.setItem(ACCESS_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
};

export const clearTokens = () => {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
};

export const isAuthenticated = (): boolean => !!getAccessToken();
