import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import PagePlaceholder from "./PagePlaceholder";

export function ProtectedView({
  allowedRoles,
  children,
}: {
  allowedRoles: string[];
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const role = user?.role;
  if (!allowedRoles || allowedRoles.length === 0) return <>{children}</>;
  if (!role) return <PagePlaceholder pageId="overview" user={user} />;
  if (allowedRoles.includes(role)) return <>{children}</>;
  return (
    <PagePlaceholder
      pageId="overview"
      user={{ ...user, name: "Acesso negado" }}
    />
  );
}

export default ProtectedView;
