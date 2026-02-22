import React from "react";
import { ROLE_COLORS } from "./constants";

export function Avatar({ user, size = 40 }: { user: any; size?: number }) {
  const role = user?.role || "STUDENT";
  const color = ROLE_COLORS[role] || "#6b7280";
  const initials = (user?.name || "?")
    .split(" ")
    .slice(0, 2)
    .map((n: string) => n[0])
    .join("")
    .toUpperCase();

  if (user?.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.name}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `linear-gradient(135deg, ${color}, ${color}99)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontWeight: 700,
        fontSize: size * 0.35,
        flexShrink: 0,
        fontFamily: "inherit",
        letterSpacing: "0.5px",
      }}
    >
      {initials}
    </div>
  );
}

export default Avatar;
