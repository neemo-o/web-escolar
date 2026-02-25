import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useWindowSize } from "./dashboard/useWindowSize";
import Avatar from "./dashboard/Avatar";
import Sidebar from "./dashboard/Sidebar";
// PagePlaceholder moved to child routes; Dashboard renders an <Outlet />
import { PAGE_TITLES } from "./dashboard/nav";
import { ROLE_COLORS, ROLE_LABELS } from "./dashboard/constants";
import { iconMenu, iconClose, iconLogout } from "./dashboard/icons";
import api from "../utils/api";

function formatRemaining(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function Dashboard() {
  const {
    user: authUser,
    school: authSchool,
    logout,
    isLoading,
    sessionSecondsRemaining,
  } = useAuth();
  const [activePage, setActivePage] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { w } = useWindowSize();

  const isMobile = w < 768;
  const user = authUser;
  const school = authSchool;
  const role = user?.role || "STUDENT";
  const accentColor = ROLE_COLORS[role] || "#6366f1";
  const SIDEBAR_W = 240;

  const showSession = typeof sessionSecondsRemaining === "number";
  const isSessionWarning =
    typeof sessionSecondsRemaining === "number" &&
    sessionSecondsRemaining > 0 &&
    sessionSecondsRemaining <= 5 * 60;

  const SessionPill = () =>
    showSession ? (
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 10px",
          borderRadius: 999,
          border: "1px solid",
          borderColor: isSessionWarning ? "#fed7aa" : "#e5e7eb",
          background: isSessionWarning ? "#fff7ed" : "#f9fafb",
          color: isSessionWarning ? "#9a3412" : "#374151",
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: "0.1px",
          whiteSpace: "nowrap",
        }}
        title="Tempo restante da sessão"
      >
        <span style={{ opacity: 0.9 }}>Sessão</span>
        <span style={{ fontVariantNumeric: "tabular-nums" }}>
          {formatRemaining(Math.max(0, sessionSecondsRemaining || 0))}
        </span>
      </div>
    ) : null;

  async function refreshNotifications() {
    try {
      const [countRes, listRes] = await Promise.all([
        api.fetchJson("/notifications/unread-count"),
        api.fetchJson("/notifications?limit=12"),
      ]);
      setUnreadCount(countRes?.unread ?? 0);
      setNotifications(listRes?.data ?? []);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    refreshNotifications();
    const t = window.setInterval(() => refreshNotifications(), 30000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    if (!notifOpen) return;
    setNotifLoading(true);
    refreshNotifications().finally(() => setNotifLoading(false));
  }, [notifOpen]);

  const BellButton = () => (
    <button
      onClick={() => setNotifOpen((v) => !v)}
      title="Notificações"
      style={{
        width: 34,
        height: 34,
        borderRadius: 10,
        border: "1px solid #e5e7eb",
        background: "#fff",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        color: "#374151",
      }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {unreadCount > 0 && (
        <span
          style={{
            position: "absolute",
            top: -4,
            right: -4,
            minWidth: 18,
            height: 18,
            padding: "0 5px",
            borderRadius: 999,
            background: "var(--school-primary, #0891b2)",
            color: "#fff",
            fontSize: 11,
            fontWeight: 800,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 6px 14px rgba(0,0,0,0.18)",
          }}
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </button>
  );

  const NotificationsPanel = () =>
    notifOpen ? (
      <div
        style={{
          position: "absolute",
          top: 48,
          right: 0,
          width: 360,
          maxWidth: "calc(100vw - 40px)",
          background: "#fff",
          border: "1px solid #e9ebf0",
          borderRadius: 14,
          boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
          overflow: "hidden",
          zIndex: 80,
        }}
      >
        <div
          style={{
            padding: "12px 14px",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <div style={{ fontWeight: 800, fontSize: 13.5, color: "#111827" }}>
            Notificações
          </div>
          <button
            onClick={async () => {
              try {
                await api.fetchJson("/notifications/read-all", {
                  method: "PATCH",
                });
                await refreshNotifications();
              } catch {}
            }}
            style={{
              border: "1px solid #e5e7eb",
              background: "#fff",
              borderRadius: 10,
              height: 30,
              padding: "0 10px",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              color: "#374151",
              fontFamily: "inherit",
            }}
          >
            Marcar como lidas
          </button>
        </div>

        <div style={{ maxHeight: 360, overflowY: "auto" }}>
          {notifLoading ? (
            <div style={{ padding: 14, color: "#9ca3af", fontSize: 13 }}>
              Carregando...
            </div>
          ) : notifications.length === 0 ? (
            <div style={{ padding: 14, color: "#9ca3af", fontSize: 13 }}>
              Sem notificações.
            </div>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={async () => {
                  try {
                    await api.fetchJson(`/notifications/${n.id}/read`, {
                      method: "PATCH",
                    });
                    await refreshNotifications();
                  } catch {}
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "12px 14px",
                  border: "none",
                  borderBottom: "1px solid #f8fafc",
                  background: n.readAt ? "#fff" : "#f0f9ff",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: 13,
                    color: "#111827",
                  }}
                >
                  {n.title}
                </div>
                <div
                  style={{ marginTop: 2, fontSize: 12.5, color: "#6b7280" }}
                >
                  {n.message}
                </div>
                <div style={{ marginTop: 6, fontSize: 11.5, color: "#9ca3af" }}>
                  {String(n.createdAt).slice(0, 19).replace("T", " ")}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    ) : null;

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 40);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!isMobile) setSidebarOpen(false);
  }, [isMobile]);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const parts = location.pathname.split("/");
    const last = parts[parts.length - 1] || "overview";
    setActivePage(last);
  }, [location.pathname]);

  const handleNavClick = (id: string) => {
    navigate(`/dashboard/${id}`);
    if (isMobile) setSidebarOpen(false);
  };

  const sidebarContent = (
    <Sidebar
      user={user}
      role={role}
      activePage={activePage}
      onNavClick={handleNavClick}
      logout={logout}
      // pass school so Sidebar can render SchoolLogo
      // (Dashboard keeps SchoolLogo to inject school props)
      // sidebarWidth is passed below
      school={school}
      sidebarWidth={SIDEBAR_W}
    />
  );

  return (
    <div
      style={{
        width: "100vw",
        height: "100dvh",
        display: "flex",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        background: "#f3f4f8",
        opacity: mounted ? 1 : 0,
        transition: "opacity 0.35s ease",
        overflow: "hidden",
      }}
    >
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            zIndex: 40,
            backdropFilter: "blur(2px)",
          }}
        />
      )}

      {isMobile ? (
        <div
          style={{
            position: "fixed",
            left: sidebarOpen ? 0 : -SIDEBAR_W,
            top: 0,
            bottom: 0,
            width: SIDEBAR_W,
            zIndex: 50,
            transition: "left 0.28s cubic-bezier(.16,1,.3,1)",
            boxShadow: sidebarOpen ? "4px 0 24px rgba(0,0,0,0.25)" : "none",
          }}
        >
          {sidebarContent}
        </div>
      ) : (
        <div
          style={{
            width: SIDEBAR_W,
            flexShrink: 0,
            boxShadow: "2px 0 12px rgba(80,60,180,0.12)",
          }}
        >
          {sidebarContent}
        </div>
      )}

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {isMobile && (
          <div
            style={{
              height: 52,
              background: "#fff",
              borderBottom: "1px solid #e9ebf0",
              display: "flex",
              alignItems: "center",
              padding: "0 16px",
              gap: 12,
              flexShrink: 0,
            }}
          >
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                background: "#fff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#374151",
              }}
            >
              {sidebarOpen ? iconClose() : iconMenu()}
            </button>
            <span
              style={{
                fontWeight: 700,
                fontSize: 15,
                color: "#111827",
                letterSpacing: "-0.3px",
              }}
            >
              {PAGE_TITLES[activePage] || "Dashboard"}
            </span>
            <div
              style={{
                marginLeft: "auto",
                display: "flex",
                gap: 10,
                alignItems: "center",
                position: "relative",
              }}
            >
              <SessionPill />
              <div style={{ position: "relative" }}>
                <BellButton />
                <NotificationsPanel />
              </div>
            </div>
          </div>
        )}

        {!isMobile && (
          <div
            style={{
              height: 56,
              background: "#fff",
              borderBottom: "1px solid #e9ebf0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 28px",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 6,
                  height: 20,
                  borderRadius: 3,
                  background: `linear-gradient(180deg, ${accentColor}, ${accentColor}88)`,
                }}
              />
              <span
                style={{
                  fontWeight: 800,
                  fontSize: 16,
                  color: "#111827",
                  letterSpacing: "-0.4px",
                }}
              >
                {PAGE_TITLES[activePage] || "Dashboard"}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                position: "relative",
              }}
            >
              <SessionPill />
              <div style={{ position: "relative" }}>
                <BellButton />
                <NotificationsPanel />
              </div>
              <div
                style={{
                  padding: "4px 10px",
                  borderRadius: 20,
                  background: `${accentColor}12`,
                  color: accentColor,
                  fontSize: 11.5,
                  fontWeight: 700,
                  letterSpacing: "0.2px",
                }}
              >
                {ROLE_LABELS[role]}
              </div>
              <Avatar user={user} size={32} />
            </div>
          </div>
        )}

        <div
          style={{
            flex: 1,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {isLoading ? (
            <div style={{ padding: 28 }}>Carregando...</div>
          ) : (
            <Outlet />
          )}
        </div>
      </div>

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');*{box-sizing:border-box}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(0,0,0,0.12);border-radius:4px}nav button:hover{background:rgba(255,255,255,0.1)!important;color:rgba(255,255,255,0.9)!important}`}</style>
    </div>
  );
}
