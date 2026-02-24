import React from "react";
import PagePlaceholder from "../PagePlaceholder";
import { useAuth } from "../../../contexts/AuthContext";

export default function StudentGrades() {
  const { user } = useAuth();
  return <PagePlaceholder pageId="student-grades" user={user} />;
}
