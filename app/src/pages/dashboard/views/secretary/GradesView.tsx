import React from "react";
import PagePlaceholder from "../../PagePlaceholder";
import { useAuth } from "../../../../contexts/AuthContext";

export default function GradesView() {
  const { user } = useAuth();
  return <PagePlaceholder pageId="grades-view" user={user} />;
}
