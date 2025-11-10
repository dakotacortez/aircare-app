export const dynamic = 'force-dynamic'
export const revalidate = 0

import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import { ProtocolContent } from './ProtocolContent'

interface PageProps {
  params: { id: string }
}

export default async function ProtocolPage({ params }: PageProps) {
  const { id } = params
  const payload = await getPayload({ config })

  // Get the current protocol
  const protocol = await payload.findByID({
    collection: 'protocols',
    id: id,
  })

  if (!protocol || protocol._status !== 'published') {
    notFound()
  }

  // Get all protocols for sidebar navigation
  const allProtocols = await payload.find({
    collection: 'protocols',
    where: {
      _status: { equals: 'published' },
    },
    sort: 'category',
    limit: 1000,
  })

  return (
    <ProtocolContent 
      protocol={protocol} 
      allProtocols={allProtocols.docs}
    />
  )
}
