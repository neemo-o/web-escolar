import React from "react";
import { getNavGroups } from "./nav";
import SchoolLogo from "./SchoolLogo";
import { ROLE_LABELS } from "./constants";
import { iconPerson, iconLogout } from "./icons";

type Props = {
  user: any;
  role: string;
  school?: any;
  activePage: string;
  onNavClick: (id: string) => void;
  logout: () => void;
  sidebarWidth?: number;
};

export default function Sidebar({
  user,
  role,
  school,
  activePage,
  onNavClick,
  logout,
  sidebarWidth = 240,
}: Props) {
  const navGroups = getNavGroups(role);

  return (
    <div
      style={{
        width: sidebarWidth,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background:
          "linear-gradient(180deg, #4f46e5 0%, #7c3aed 55%, #6d28d9 100%)",
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          padding: "24px 20px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 160,
            height: 160,
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.08)",
            top: -60,
            right: -60,
            pointerEvents: "none",
          }}
        />
        {/* SchoolLogo kept in Dashboard to allow injection of school props */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <SchoolLogo
            name={
              school?.name ??
              (role === "ADMIN_GLOBAL" ? "Sistema Global" : "Colégio")
            }
          />
        </div>
      </div>

      <div
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        {/* Avatar is rendered by parent (Dashboard) to allow control */}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              color: "#fff",
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: "-0.2px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {user?.name || "Usuário"}
          </div>
          <div
            style={{
              color: "rgba(255,255,255,0.55)",
              fontSize: 11,
              marginTop: 1,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {ROLE_LABELS[role]}
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: "10px 10px", overflowY: "auto" }}>
        {navGroups.map((group) => (
          <div key={group.label} style={{ marginBottom: 6 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "rgba(255,255,255,0.38)",
                letterSpacing: "0.8px",
                textTransform: "uppercase",
                padding: "8px 10px 4px",
              }}
            >
              {group.label}
            </div>
            {group.items.map((item) => {
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavClick(item.id)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    padding: "8px 10px",
                    borderRadius: 9,
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    fontSize: 13,
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? "#fff" : "rgba(255,255,255,0.62)",
                    background: isActive
                      ? "rgba(255,255,255,0.15)"
                      : "transparent",
                    textAlign: "left",
                    transition: "background 0.15s, color 0.15s",
                    marginBottom: 1,
                  }}
                >
                  <span
                    style={{
                      opacity: isActive ? 1 : 0.7,
                      flexShrink: 0,
                      color: isActive ? "#fff" : "rgba(255,255,255,0.6)",
                    }}
                  >
                    {item.icon}
                  </span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.badge != null && (
                    <span
                      style={{
                        background: "rgba(255,255,255,0.25)",
                        color: "#fff",
                        borderRadius: 10,
                        padding: "1px 7px",
                        fontSize: 10,
                        fontWeight: 700,
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div
        style={{
          padding: "10px 10px 14px",
          borderTop: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <button
          onClick={() => onNavClick("profile")}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 9,
            padding: "8px 10px",
            borderRadius: 9,
            border: "none",
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: 13,
            fontWeight: activePage === "profile" ? 700 : 500,
            color: activePage === "profile" ? "#fff" : "rgba(255,255,255,0.62)",
            background:
              activePage === "profile"
                ? "rgba(255,255,255,0.15)"
                : "transparent",
            textAlign: "left",
            marginBottom: 2,
          }}
        >
          <span style={{ opacity: 0.75 }}>{iconPerson()}</span>
          Meu Perfil
        </button>
        <button
          onClick={logout}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 9,
            padding: "8px 10px",
            borderRadius: 9,
            border: "none",
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: 13,
            fontWeight: 500,
            color: "rgba(255,100,100,0.85)",
            background: "transparent",
            textAlign: "left",
            transition: "background 0.15s",
          }}
        >
          <span style={{ opacity: 0.75 }}>{iconLogout()}</span>
          Sair
        </button>
      </div>
    </div>
  );
}
