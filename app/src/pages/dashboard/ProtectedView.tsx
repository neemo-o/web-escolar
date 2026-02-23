import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Navigate } from "react-router-dom";

function LoadingSpinner() {
  return (
    <div
      style={{
        width: "100%",
        height: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div>Carregando...</div>
    </div>
  );
}

export function ProtectedView({
  allowedRoles,
  children,
}: {
  allowedRoles: string[];
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const role = user?.role;
  if (!allowedRoles || allowedRoles.length === 0) return <>{children}</>;
  if (isLoading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (!role) return <Navigate to="/dashboard/overview" replace />;
  if (allowedRoles.includes(role)) return <>{children}</>;
  // access denied: notify and redirect to overview
  try {
    window.dispatchEvent(
      new CustomEvent("toast", {
        detail: { type: "error", message: "Acesso negado" },
      }),
    );
  } catch {}
  return <Navigate to="/dashboard/overview" replace />;
}

export default ProtectedView;
