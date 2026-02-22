import React from "react";
import PagePlaceholder from "../../PagePlaceholder";
import { useAuth } from "../../../../contexts/AuthContext";

export default function Users() {
  const { user } = useAuth();
  return <PagePlaceholder pageId="users" user={user} />;
}
