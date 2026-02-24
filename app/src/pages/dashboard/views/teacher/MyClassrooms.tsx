import { useAuth } from '../../../../contexts/AuthContext';
import PagePlaceholder from '../../PagePlaceholder'

export default function MyClassrooms() {
  const { user } = useAuth()
  return <PagePlaceholder pageId="my-classrooms" user={user} />
}
