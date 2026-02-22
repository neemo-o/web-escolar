import React from "react";
import PagePlaceholder from "../../PagePlaceholder";
import { useAuth } from "../../../../contexts/AuthContext";

export default function Settings() {
  const { user } = useAuth();
  return <PagePlaceholder pageId="settings" user={user} />;
}
