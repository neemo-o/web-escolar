import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useWindowSize } from "./dashboard/useWindowSize";
import Avatar from "./dashboard/Avatar";
import SchoolLogo from "./dashboard/SchoolLogo";
import Sidebar from "./dashboard/Sidebar";
// PagePlaceholder moved to child routes; Dashboard renders an <Outlet />
import { getNavGroups, PAGE_TITLES } from "./dashboard/nav";
import {
  ROLE_COLORS,
  ROLE_LABELS,
  MOCK_USER,
  MOCK_SCHOOL,
} from "./dashboard/constants";
import { iconMenu, iconClose, iconLogout, iconPerson } from "./dashboard/icons";

export default function Dashboard() {
  const { user: authUser, school: authSchool, logout } = useAuth();
  const [activePage, setActivePage] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { w } = useWindowSize();

  const isMobile = w < 768;
  const user = authUser || MOCK_USER;
  const school = authSchool || MOCK_SCHOOL;
  const role = user?.role || "STUDENT";
  const accentColor = ROLE_COLORS[role] || "#6366f1";
  const navGroups = getNavGroups(role);
  const SIDEBAR_W = 240;

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
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
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
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
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
          <Outlet />
        </div>
      </div>

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');*{box-sizing:border-box}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(0,0,0,0.12);border-radius:4px}nav button:hover{background:rgba(255,255,255,0.1)!important;color:rgba(255,255,255,0.9)!important}`}</style>
    </div>
  );
}
