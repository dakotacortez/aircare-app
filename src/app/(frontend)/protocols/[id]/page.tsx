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

  return {
    title: `Protocol ${id}`,
  }
}
