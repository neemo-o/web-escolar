import React from "react";

export function SchoolLogo({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 14,
          background: "rgba(255,255,255,0.18)",
          border: "1.5px solid rgba(255,255,255,0.22)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backdropFilter: "blur(4px)",
        }}
      >
        <span
          style={{
            color: "#fff",
            fontWeight: 800,
            fontSize: 18,
            letterSpacing: "-0.5px",
          }}
        >
          {initials}
        </span>
      </div>
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            color: "#fff",
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: "-0.3px",
            lineHeight: 1.2,
          }}
        >
          {name}
        </div>
        <div
          style={{
            color: "rgba(255,255,255,0.5)",
            fontSize: 10.5,
            marginTop: 1,
          }}
        >
          Sistema Educacional
        </div>
      </div>
    </div>
  );
}

export default SchoolLogo;
