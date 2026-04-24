import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, saveToken, loadToken, clearToken, formatApiError } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null = loading, false = logged out
  const [error, setError] = useState("");

  const bootstrap = useCallback(async () => {
    const token = await loadToken();
    if (!token) {
      setUser(false);
      return;
    }
    try {
      const { data } = await api.get("/auth/me");
      setUser(data);
    } catch {
      await clearToken();
      setUser(false);
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const login = async (email, password) => {
    setError("");
    try {
      const { data } = await api.post("/auth/login", { email, password });
      await saveToken(data.access_token);
      setUser(data);
      return true;
    } catch (e) {
      setError(formatApiError(e.response?.data?.detail, "Login failed"));
      return false;
    }
  };

  const register = async (name, email, password) => {
    setError("");
    try {
      const { data } = await api.post("/auth/register", { name, email, password });
      await saveToken(data.access_token);
      setUser(data);
      return true;
    } catch (e) {
      setError(formatApiError(e.response?.data?.detail, "Registration failed"));
      return false;
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      /* ignore */
    }
    await clearToken();
    setUser(false);
  };

  return (
    <AuthContext.Provider value={{ user, error, setError, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
