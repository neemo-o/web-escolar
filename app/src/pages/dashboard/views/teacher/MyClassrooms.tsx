import React from 'react'
import PagePlaceholder from '../../PagePlaceholder'
import { useAuth } from '../../../../contexts/AuthContext'

export default function MyClassrooms() {
  const { user } = useAuth()
  return <PagePlaceholder pageId="my-classrooms" user={user} />
}
