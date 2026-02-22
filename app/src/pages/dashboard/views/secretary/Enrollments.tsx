import React from "react";
import PagePlaceholder from "../../PagePlaceholder";
import { useAuth } from "../../../../contexts/AuthContext";

export default function Enrollments() {
  const { user } = useAuth();
  return <PagePlaceholder pageId="enrollments" user={user} />;
}
