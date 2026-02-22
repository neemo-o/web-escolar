import React from "react";
import PagePlaceholder from "../../PagePlaceholder";
import { useAuth } from "../../../../contexts/AuthContext";

export default function StudentProgress() {
  const { user } = useAuth();
  return <PagePlaceholder pageId="student-progress" user={user} />;
}
