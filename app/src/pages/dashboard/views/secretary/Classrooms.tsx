import React from "react";
import PagePlaceholder from "../../PagePlaceholder";
import { useAuth } from "../../../../contexts/AuthContext";

export default function Classrooms() {
  const { user } = useAuth();
  return <PagePlaceholder pageId="classrooms" user={user} />;
}
