import React from "react";
import PagePlaceholder from "../../PagePlaceholder";
import { useAuth } from "../../../../contexts/AuthContext";

export default function Reports() {
  const { user } = useAuth();
  return <PagePlaceholder pageId="reports" user={user} />;
}
