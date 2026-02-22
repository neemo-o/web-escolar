import React from "react";
import PagePlaceholder from "../../PagePlaceholder";
import { useAuth } from "../../../../contexts/AuthContext";

export default function Audit() {
  const { user } = useAuth();
  return <PagePlaceholder pageId="audit" user={user} />;
}
