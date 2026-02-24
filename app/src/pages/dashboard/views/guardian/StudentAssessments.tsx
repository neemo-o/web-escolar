import { useAuth } from "../../../../contexts/AuthContext";
import PagePlaceholder from "../../PagePlaceholder";

export default function StudentAssessments() {
  const { user } = useAuth();
  return <PagePlaceholder pageId="student-assessments" user={user} />;
}
