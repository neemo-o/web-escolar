import React from 'react'
import PagePlaceholder from '../../PagePlaceholder'
import { useAuth } from '../../../../contexts/AuthContext'

export default function Progress() {
  const { user } = useAuth()
  return <PagePlaceholder pageId="progress" user={user} />
}
