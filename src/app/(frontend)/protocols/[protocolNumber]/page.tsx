export const dynamic = 'force-dynamic'
export const revalidate = 0

import type { Metadata } from 'next'
import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import { ProtocolContent } from './ProtocolContent'

type Args = {
  params: Promise<{ protocolNumber: string }>
}

export default async function ProtocolPage({ params: paramsPromise }: Args) {
  const { protocolNumber } = await paramsPromise
  const payload = await getPayload({ config })

  // Get the current protocol by protocol number
  const result = await payload.find({
    collection: 'protocols',
    where: {
      protocolNumber: { equals: protocolNumber },
      _status: { equals: 'published' },
    },
    limit: 1,
  })

  const protocol = result.docs[0]

  if (!protocol) {
    notFound()
  }

  // Get all protocols for sidebar navigation
  const allProtocols = await payload.find({
    collection: 'protocols',
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
  const { protocolNumber } = await paramsPromise
  const payload = await getPayload({ config })

  try {
    const result = await payload.find({
      collection: 'protocols',
      where: {
        protocolNumber: { equals: protocolNumber },
      },
      limit: 1,
    })

    const protocol = result.docs[0]

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
