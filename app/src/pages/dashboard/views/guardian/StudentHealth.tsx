import React from "react";
import PagePlaceholder from "../../PagePlaceholder";
import { useAuth } from "../../../../contexts/AuthContext";

export default function StudentHealth() {
  const { user } = useAuth();
  return <PagePlaceholder pageId="student-health" user={user} />;
}
