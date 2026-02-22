import React from "react";
import PagePlaceholder from "../../PagePlaceholder";
import { useAuth } from "../../../../contexts/AuthContext";

export default function StudentAssessments() {
  const { user } = useAuth();
  return <PagePlaceholder pageId="student-assessments" user={user} />;
}
