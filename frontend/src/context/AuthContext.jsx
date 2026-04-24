import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, formatApiError } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null = checking, false = logged out, obj = user
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data);
    } catch (e) {
      // 401 on boot just means "not logged in" — not a real error.
      if (e?.response?.status !== 401) {
        console.warn("Auth refresh failed:", e);
      }
      setUser(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (email, password) => {
    setError("");
    try {
      const { data } = await api.post("/auth/login", { email, password });
      setUser(data);
      return true;
    } catch (e) {
      setError(formatApiError(e.response?.data?.detail, "Login failed"));
      return false;
    }
  }, []);

  const register = useCallback(async (name, email, password) => {
    setError("");
    try {
      const { data } = await api.post("/auth/register", { name, email, password });
      setUser(data);
      return true;
    } catch (e) {
      setError(formatApiError(e.response?.data?.detail, "Registration failed"));
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch (e) {
      // Network failure on logout is non-blocking — we still clear client state.
      console.warn("Logout request failed; clearing client state anyway:", e);
    }
    setUser(false);
  }, []);

  const value = useMemo(
    () => ({ user, error, setError, login, register, logout, refresh }),
    [user, error, login, register, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
