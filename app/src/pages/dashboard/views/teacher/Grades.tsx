import React from 'react'
import PagePlaceholder from '../../PagePlaceholder'
import { useAuth } from '../../../../contexts/AuthContext'

export default function Grades() {
  const { user } = useAuth()
  return <PagePlaceholder pageId="grades" user={user} />
}
