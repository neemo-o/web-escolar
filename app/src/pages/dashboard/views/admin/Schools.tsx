import React from 'react'
import PagePlaceholder from '../../PagePlaceholder'
import { useAuth } from '../../../../contexts/AuthContext'

export default function Schools() {
  const { user } = useAuth()
  return <PagePlaceholder pageId="schools" user={user} />
}
