import React from "react";
import PagePlaceholder from "../../PagePlaceholder";
import { useAuth } from "../../../../contexts/AuthContext";

export default function StudentClassrooms() {
  const { user } = useAuth();
  return <PagePlaceholder pageId="student-classrooms" user={user} />;
}
