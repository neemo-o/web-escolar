import React from 'react'
import PagePlaceholder from '../../PagePlaceholder'
import { useAuth } from '../../../../contexts/AuthContext'

export default function MyStudents() {
  const { user } = useAuth()
  return <PagePlaceholder pageId="my-students" user={user} />
}
