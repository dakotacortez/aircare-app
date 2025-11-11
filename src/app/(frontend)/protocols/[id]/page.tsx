export const dynamic = 'force-dynamic'
export const revalidate = 0

import type { Metadata } from 'next'
import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import { ProtocolContent } from './ProtocolContent'

type Args = {
  params: Promise<{ id: string }>
}

export default async function ProtocolPage({ params: paramsPromise }: Args) {
  const { id } = await paramsPromise
  const payload = await getPayload({ config })

  // Get the current protocol
  const protocol = await payload.findByID({
    collection: 'protocol',
    id: id,
  })

  if (!protocol || protocol._status !== 'published') {
    notFound()
  }

  // Get all protocols for sidebar navigation
  const allProtocols = await payload.find({
    collection: 'protocol',
    where: {
      _status: { equals: 'published' },
    },
    sort: '_order',
    limit: 1000,
  })

  return (
    <ProtocolContent
      protocol={protocol}
      allProtocols={allProtocols.docs}
    />
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { id } = await paramsPromise
  const payload = await getPayload({ config })

  try {
    const protocol = await payload.findByID({
      collection: 'protocol',
      id: id,
    })

    if (!protocol) {
      return { title: 'Protocol Not Found' }
    }

    return {
      title: `${protocol.title} - AirCare Protocols`,
      description: protocol.subcategory || `${protocol.category || 'Protocol'} - ${protocol.title}`,
    }
  } catch (_error) {
    return { title: 'Protocol Not Found' }
  }
}
