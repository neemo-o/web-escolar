import React from 'react'
import PagePlaceholder from '../../PagePlaceholder'
import { useAuth } from '../../../../contexts/AuthContext'

export default function Schedule() {
  const { user } = useAuth()
  return <PagePlaceholder pageId="schedule" user={user} />
}
