import React from "react";
import PagePlaceholder from "../../PagePlaceholder";
import { useAuth } from "../../../../contexts/AuthContext";

export default function GlobalUsers() {
  const { user } = useAuth();
  return <PagePlaceholder pageId="global-users" user={user} />;
}
