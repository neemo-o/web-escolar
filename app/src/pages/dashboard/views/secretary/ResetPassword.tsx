import React from "react";
import PagePlaceholder from "../../PagePlaceholder";
import { useAuth } from "../../../../contexts/AuthContext";

export default function ResetPassword() {
  const { user } = useAuth();
  return <PagePlaceholder pageId="reset-password" user={user} />;
}
