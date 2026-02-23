import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";

type AuthContextType = {
  token: string | null;
  user: any | null;
  school: any | null;
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
  const [school, setSchool] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(
    () => !!localStorage.getItem("token"),
  );
  const navigate = useNavigate();
  const expirationTimer = useRef<number | null>(null);

  useEffect(() => {
    try {
      if (token) localStorage.setItem("token", token);
      else localStorage.removeItem("token");
    } catch {}
  }, [token]);

  // keep api util in sync with current token
  useEffect(() => {
    try {
      api.setAuthToken(token);
    } catch {}
  }, [token]);

  // When token is present, try to fetch /auth/me to populate user
  useEffect(() => {
    let mounted = true;
    async function loadMe() {
      if (!token) {
        setUser(null);
        setSchool(null);
        return;
      }
      setIsLoading(true);
      try {
        // parallelize user + school fetch
        const [data, schoolData] = await Promise.allSettled([
          api.fetchJson("/auth/me"),
          api.fetchJson("/schools/me"),
        ]);
        if (mounted) {
          if (data.status === "fulfilled") setUser(data.value);
          else setUser(null);
          if (schoolData.status === "fulfilled") setSchool(schoolData.value);
          else setSchool(null);
        }
        // schedule logout based on JWT exp if present
        try {
          const t = token;
          if (t) {
            const parts = t.split(".");
            if (parts.length >= 2) {
              const payload = JSON.parse(atob(parts[1]));
              const exp = payload?.exp;
              if (exp) {
                const ms = exp * 1000 - Date.now() - 60 * 1000; // logout 60s before
                if (expirationTimer.current)
                  window.clearTimeout(expirationTimer.current);
                if (ms > 0)
                  expirationTimer.current = window.setTimeout(() => {
                    setToken(null);
                  }, ms);
              }
            }
          }
        } catch (err) {
          /* ignore */
        }
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
    // schedule logout based on JWT exp
    try {
      const parts = t.split(".");
      if (parts.length >= 2) {
        const payload = JSON.parse(atob(parts[1]));
        const exp = payload?.exp;
        if (exp) {
          const ms = exp * 1000 - Date.now() - 60 * 1000;
          if (expirationTimer.current)
            window.clearTimeout(expirationTimer.current);
          if (ms > 0)
            expirationTimer.current = window.setTimeout(() => {
              setToken(null);
            }, ms);
        }
      }
    } catch {}
    // navigation happens after token is set and /auth/me will be triggered
    navigate("/dashboard");
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setSchool(null);
    api.setAuthToken(null);
    if (expirationTimer.current) window.clearTimeout(expirationTimer.current);
    navigate("/login");
  };

  // listen to global auth:logout events (dispatched by fetchJson on 401)
  useEffect(() => {
    function onExternalLogout() {
      setToken(null);
      setUser(null);
      setSchool(null);
      api.setAuthToken(null);
      if (expirationTimer.current) window.clearTimeout(expirationTimer.current);
      navigate("/login");
    }
    try {
      window.addEventListener("auth:logout", onExternalLogout as EventListener);
    } catch {}
    return () => {
      try {
        window.removeEventListener(
          "auth:logout",
          onExternalLogout as EventListener,
        );
      } catch {}
    };
  }, [navigate]);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        school,
        login,
        logout,
        isAuthenticated: !!token && !!user,
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
