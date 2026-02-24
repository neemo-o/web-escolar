import { useAuth } from '../../../../contexts/AuthContext';
import PagePlaceholder from '../../PagePlaceholder'

export default function MyAssessments() {
  const { user } = useAuth()
  return <PagePlaceholder pageId="my-assessments" user={user} />
}
