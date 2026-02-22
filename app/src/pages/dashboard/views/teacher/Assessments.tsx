import React from 'react'
import PagePlaceholder from '../../PagePlaceholder'
import { useAuth } from '../../../../contexts/AuthContext'

export default function Assessments() {
  const { user } = useAuth()
  return <PagePlaceholder pageId="assessments" user={user} />
}
