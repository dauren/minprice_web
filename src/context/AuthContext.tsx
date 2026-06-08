import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { apiClient, API_ENDPOINTS } from "@/lib/api";
import { getAccessToken, setTokens, clearTokens } from "@/lib/auth";

export interface AuthUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  has_google: boolean;
  has_telegram: boolean;
  guest_uuid: string | null;
}

// Raw payload from the Telegram Login Widget callback.
export interface TelegramAuthData {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  loginWithTelegram: (data: TelegramAuthData) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(!!getAccessToken());

  const fetchMe = useCallback(async () => {
    try {
      const me = await apiClient.get<AuthUser>(API_ENDPOINTS.authMe());
      setUser(me);
    } catch (e) {
      // Token invalid / refresh failed — treat as logged out.
      clearTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // On mount, if we have a token, resolve the current user.
  useEffect(() => {
    if (getAccessToken()) {
      fetchMe();
    } else {
      setLoading(false);
    }
  }, [fetchMe]);

  const loginWithTelegram = useCallback(async (data: TelegramAuthData) => {
    setLoading(true);
    const tokens = await apiClient.post<{ access: string; refresh: string }>(
      API_ENDPOINTS.authTelegram(),
      data,
    );
    setTokens(tokens);
    await fetchMe();
  }, [fetchMe]);

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, isAuthenticated: !!user, loginWithTelegram, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
