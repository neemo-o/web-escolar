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
  // access denied: redirect to overview with toast in location state
  return (
    <Navigate
      to={{ pathname: "/dashboard/overview" }}
      state={{ toast: { type: "error", message: "Acesso negado" } }}
      replace
    />
  );
}

export default ProtectedView;
