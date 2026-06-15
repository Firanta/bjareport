// =============================================================
// BJA Report — Auth Context
// =============================================================

"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import type { User } from "firebase/auth";
import { onTokenChange, logout as firebaseLogout } from "@/lib/firebase/auth";
import Cookies from "js-cookie";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onTokenChange(async (u) => {
      setUser(u);
      setLoading(false);
      if (u) {
        try {
          const token = await u.getIdToken();
          Cookies.set("firebase-auth-token", token, {
            expires: 30,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
          });
        } catch (err) {
          console.error("Failed to update token cookie:", err);
        }
      } else {
        Cookies.remove("firebase-auth-token", { path: '/' });
      }
    });
    return () => unsubscribe();
  }, []);

  const logout = useCallback(async () => {
    await firebaseLogout();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
