import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

export default function Dashboard() {
  const { logout } = useAuth();
  const [me, setMe] = useState<any>(null);

  useEffect(() => {
    // Lightweight placeholder; real app may call /auth/me
    setMe({ name: "Usuário" });
  }, []);

  return (
    <div
      style={{
        padding: 28,
        fontFamily: "Plus Jakarta Sans, system-ui, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2>Dashboard</h2>
        <div>
          <button
            onClick={logout}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "none",
              background: "#ef4444",
              color: "#fff",
            }}
          >
            Sair
          </button>
        </div>
      </div>

      <p style={{ color: "#374151" }}>Bem-vindo, {me?.name}</p>
    </div>
  );
}
