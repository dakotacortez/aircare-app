export const dynamic = 'force-dynamic'
export const revalidate = 0

import type { Metadata } from 'next'
import React from 'react'
import { notFound } from 'next/navigation'
import { draftMode } from 'next/headers'
import { ProtocolContent } from './ProtocolContent'
import { getMeUser } from '@/utilities/getMeUser'
import { checkProtocolAccess } from '@/utilities/checkProtocolAccess'
import { findProtocolsForUser, findProtocolByCodeForUser, findProtocolsForMetadata } from '@/utilities/protocolQueries'
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

  // User has access, fetch protocols using centralized helper
  const protocol = await findProtocolByCodeForUser(user, protocolNumber, {
    draft: canPreviewDraft,
    depth: 2, // Fetch related medications and protocols
  })

  if (!protocol) {
    notFound()
  }

  // Get all protocols for sidebar navigation
  const allProtocols = await findProtocolsForUser(user, {
    draft: canPreviewDraft,
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

  try {
    // Use metadata helper that only fetches published protocols
    const result = await findProtocolsForMetadata({
      where: { code: { equals: protocolNumber } },
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
