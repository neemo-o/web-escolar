import React from 'react'
import PagePlaceholder from '../../PagePlaceholder'
import { useAuth } from '../../../../contexts/AuthContext'

export default function MyProgress() {
  const { user } = useAuth()
  return <PagePlaceholder pageId="my-progress" user={user} />
}
