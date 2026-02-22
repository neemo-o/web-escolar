import React from 'react'
import PagePlaceholder from '../../PagePlaceholder'
import { useAuth } from '../../../../contexts/AuthContext'

export default function MyAssessments() {
  const { user } = useAuth()
  return <PagePlaceholder pageId="my-assessments" user={user} />
}
