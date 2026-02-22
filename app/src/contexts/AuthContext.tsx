import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";

type AuthContextType = {
  token: string | null;
  user: any | null;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem("token");
    } catch {
      return null;
    }
  });
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      if (token) localStorage.setItem("token", token);
      else localStorage.removeItem("token");
    } catch {}
  }, [token]);

  // When token is present, try to fetch /auth/me to populate user
  useEffect(() => {
    let mounted = true;
    async function loadMe() {
      if (!token) {
        setUser(null);
        return;
      }
      setIsLoading(true);
      try {
        const data = await api.fetchJson("/auth/me");
        if (mounted) setUser(data);
      } catch (err) {
        console.warn("Failed to fetch /auth/me", err);
        // token likely invalid — clear it
        if (mounted) setToken(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    loadMe();
    return () => {
      mounted = false;
    };
  }, [token]);

  const login = (t: string) => {
    setToken(t);
    // navigation happens after token is set and /auth/me will be triggered
    navigate("/dashboard");
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    navigate("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        login,
        logout,
        isAuthenticated: !!token,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export default AuthContext;
