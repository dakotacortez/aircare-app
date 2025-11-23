'use client'
import { getClientSideURL } from '@/utilities/getURL'
import { RefreshRouteOnSave as PayloadLivePreview } from '@payloadcms/live-preview-react'
import { useRouter } from 'next/navigation'
import React from 'react'

export const LivePreviewListener: React.FC = () => {
  const router = useRouter()
  const serverURL = getClientSideURL()

  // Validate URL before passing to PayloadLivePreview
  if (!serverURL) {
    console.error('LivePreviewListener: serverURL is empty, skipping live preview initialization')
    return null
  }

  return <PayloadLivePreview refresh={router.refresh} serverURL={serverURL} />
}
