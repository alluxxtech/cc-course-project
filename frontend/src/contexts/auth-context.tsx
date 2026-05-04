"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { apiFetch } from "../lib/api";
import type { User } from "../types/user";

type AuthState =
  | { status: "loading" }
  | { status: "authenticated"; user: User }
  | { status: "unauthenticated" };

type AuthContextValue = AuthState & {
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: React.ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    apiFetch<User>("/auth/me")
      .then((user) => {
        if (!cancelled) setState({ status: "authenticated", user });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "unauthenticated" });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const refresh = useCallback(async () => {
    try {
      const user = await apiFetch<User>("/auth/me");
      setState({ status: "authenticated", user });
    } catch {
      setState({ status: "unauthenticated" });
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } finally {
      setState({ status: "unauthenticated" });
      window.location.replace("/login");
    }
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
