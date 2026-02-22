import React from 'react'
import PagePlaceholder from '../../PagePlaceholder'
import { useAuth } from '../../../../contexts/AuthContext'

export default function Profile() {
  const { user } = useAuth()
  return <PagePlaceholder pageId="profile" user={user} />
}
