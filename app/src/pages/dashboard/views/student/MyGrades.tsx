import React from 'react'
import PagePlaceholder from '../../PagePlaceholder'
import { useAuth } from '../../../../contexts/AuthContext'

export default function MyGrades() {
  const { user } = useAuth()
  return <PagePlaceholder pageId="my-grades" user={user} />
}
