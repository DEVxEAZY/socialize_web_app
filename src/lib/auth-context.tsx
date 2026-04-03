"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { api } from "./api";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem("socialize_token");
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const { user } = await api.getMe();
      setUser(user);
    } catch {
      localStorage.removeItem("socialize_token");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password);
    localStorage.setItem("socialize_token", res.token);
    const { user } = await api.getMe();
    setUser(user);
  };

  const register = async (email: string, password: string, displayName: string) => {
    const res = await api.register(email, password, displayName);
    localStorage.setItem("socialize_token", res.token);
    const { user } = await api.getMe();
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem("socialize_token");
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
