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
  sessionExpiresAtMs: number | null;
  sessionSecondsRemaining: number | null;
  refreshSchool: () => Promise<void>;
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
  const [sessionExpiresAtMs, setSessionExpiresAtMs] = useState<number | null>(
    null,
  );
  const [sessionSecondsRemaining, setSessionSecondsRemaining] = useState<
    number | null
  >(null);
  const [isLoading, setIsLoading] = useState(
    () => !!localStorage.getItem("token"),
  );
  const navigate = useNavigate();
  const expirationTimer = useRef<number | null>(null);
  const tickTimer = useRef<number | null>(null);

  function applySchoolTheme(s: any | null) {
    try {
      const primary = s?.config?.primaryColor || "#0891b2";
      const sidebar = s?.config?.secondaryColor || "#0e7490";
      document.documentElement.style.setProperty("--school-primary", primary);
      document.documentElement.style.setProperty("--school-sidebar", sidebar);
    } catch {}
  }

  function base64UrlDecode(input: string) {
    let s = input.replace(/-/g, "+").replace(/_/g, "/");
    while (s.length % 4) s += "=";
    return atob(s);
  }

  function parseJwtExp(t: string | null): number | null {
    try {
      if (!t) return null;
      const parts = t.split(".");
      if (parts.length < 2) return null;
      const payload = JSON.parse(base64UrlDecode(parts[1]));
      const exp = payload?.exp;
      return typeof exp === "number" ? exp : null;
    } catch {
      return null;
    }
  }

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

  function clearExpirationTimer() {
    if (expirationTimer.current) {
      window.clearTimeout(expirationTimer.current);
      expirationTimer.current = null;
    }
  }

  function clearTickTimer() {
    if (tickTimer.current) {
      window.clearInterval(tickTimer.current);
      tickTimer.current = null;
    }
  }

  function computeExpiresAtMs(t: string | null): number | null {
    const exp = parseJwtExp(t);
    if (!exp) return null;
    return exp * 1000;
  }

  function scheduleExpiration(t: string | null) {
    clearExpirationTimer();
    const expiresAt = computeExpiresAtMs(t);
    if (!expiresAt) return;
    const ms = expiresAt - Date.now();
    if (ms <= 0) {
      logout();
      return;
    }
    expirationTimer.current = window.setTimeout(() => {
      logout();
    }, ms);
  }

  function startSessionTick(expiresAt: number | null) {
    clearTickTimer();
    setSessionExpiresAtMs(expiresAt);
    if (!expiresAt) {
      setSessionSecondsRemaining(null);
      return;
    }
    const update = () => {
      const s = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setSessionSecondsRemaining(s);
      if (s <= 0) logout();
    };
    update();
    tickTimer.current = window.setInterval(update, 1000);
  }

  // When token is present, try to fetch /auth/me to populate user
  useEffect(() => {
    let mounted = true;
    async function loadMe() {
      if (!token) {
        setUser(null);
        setSchool(null);
        startSessionTick(null);
        return;
      }
      // clear previous user/school to avoid leaking stale data while fetching
      setUser(null);
      setSchool(null);
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
          if (schoolData.status === "fulfilled") {
            setSchool(schoolData.value);
            applySchoolTheme(schoolData.value);
          }
          else setSchool(null);
        }

        if (mounted && data.status !== "fulfilled") {
          // trigger full logout flow
          setToken(null);
          api.setAuthToken(null);
          clearExpirationTimer();
          clearTickTimer();
          setSessionExpiresAtMs(null);
          setSessionSecondsRemaining(null);
          navigate("/login");
          setIsLoading(false);
          return;
        }
        const expiresAt = computeExpiresAtMs(token);
        startSessionTick(expiresAt);
        scheduleExpiration(token);
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
    const expiresAt = computeExpiresAtMs(t);
    startSessionTick(expiresAt);
    scheduleExpiration(t);
    // navigation happens after token is set and /auth/me will be triggered
    navigate("/dashboard");
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setSchool(null);
    setSessionExpiresAtMs(null);
    setSessionSecondsRemaining(null);
    api.setAuthToken(null);
    if (expirationTimer.current) window.clearTimeout(expirationTimer.current);
    clearTickTimer();
    navigate("/login");
  };

  const refreshSchool = async () => {
    if (!token) return;
    try {
      const s = await api.fetchJson("/schools/me");
      setSchool(s);
      applySchoolTheme(s);
    } catch {}
  };

  // listen to global auth:logout events (dispatched by fetchJson on 401)
  useEffect(() => {
    function onExternalLogout() {
      // reuse the unified logout flow
      logout();
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
        sessionExpiresAtMs,
        sessionSecondsRemaining,
        refreshSchool,
        login,
        logout,
        // only consider authenticated when not loading and user+token present
        isAuthenticated: !isLoading && !!token && !!user,
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
