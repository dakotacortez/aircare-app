export const dynamic = 'force-dynamic'
export const revalidate = 0

import type { Metadata } from 'next'
import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import { draftMode } from 'next/headers'
import { ProtocolContent } from './ProtocolContent'
import { getMeUser } from '@/utilities/getMeUser'
import { checkProtocolAccess } from '@/utilities/checkProtocolAccess'
import { ProtocolAccessDenied } from '@/components/ProtocolAccessDenied'
import { LivePreviewListener } from '@/components/LivePreviewListener'

type Args = {
  params: Promise<{ protocolNumber: string }>
}

export default async function ProtocolPage({ params: paramsPromise }: Args) {
  const { protocolNumber } = await paramsPromise
  const { isEnabled: isDraftMode } = await draftMode()

  // Check authentication first
  const { user } = await getMeUser()
  const accessStatus = checkProtocolAccess(user)

  // If access denied, show appropriate message
  if (!accessStatus.allowed) {
    return (
      <ProtocolAccessDenied
        reason={accessStatus.reason}
        userName={accessStatus.reason !== 'not-logged-in' ? accessStatus.user.name : undefined}
      />
    )
  }

  const currentUser = accessStatus.user
  const canPreviewDraft = isDraftMode && (currentUser.role === 'content-team' || currentUser.role === 'admin-team')

  // User has access, fetch protocols
  const payload = await getPayload({ config })

  // Get the current protocol by code
  const result = await payload.find({
    collection: 'protocols',
    draft: canPreviewDraft,
    overrideAccess: true, // Safe to override since we already checked access above
    where: canPreviewDraft
      ? {
          code: { equals: protocolNumber },
        }
      : {
          code: { equals: protocolNumber },
          _status: { equals: 'published' },
        },
    limit: 1,
    depth: 2, // Fetch related medications and protocols
  })

  const protocol = result.docs[0]

  if (!protocol) {
    notFound()
  }

  // Get all protocols for sidebar navigation
  const allProtocols = await payload.find({
    collection: 'protocols',
    draft: canPreviewDraft,
    overrideAccess: true, // Safe to override since we already checked access above
    ...(canPreviewDraft
      ? {}
      : {
          where: {
            _status: { equals: 'published' },
          },
        }),
    sort: '_order',
    limit: 1000,
  })

  return (
    <>
      {canPreviewDraft && <LivePreviewListener />}
      <ProtocolContent protocol={protocol} allProtocols={allProtocols.docs} />
    </>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { protocolNumber } = await paramsPromise
  const { isEnabled: isDraftMode } = await draftMode()
  const payload = await getPayload({ config })

  try {
    const result = await payload.find({
      collection: 'protocols',
      draft: isDraftMode,
      overrideAccess: true, // Safe to override for metadata generation
      where: isDraftMode
        ? {
            code: { equals: protocolNumber },
          }
        : {
            code: { equals: protocolNumber },
            _status: { equals: 'published' },
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
