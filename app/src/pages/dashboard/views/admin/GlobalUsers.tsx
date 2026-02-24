import { useAuth } from "../../../../contexts/AuthContext";
import PagePlaceholder from "../../PagePlaceholder";

export default function GlobalUsers() {
  const { user } = useAuth();
  return <PagePlaceholder pageId="global-users" user={user} />;
}
