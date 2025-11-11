export const dynamic = 'force-dynamic'
export const revalidate = 0

import { getPayload } from 'payload'
import config from '@payload-config'
import { redirect } from 'next/navigation'
import { getMeUser } from '@/utilities/getMeUser'
import { checkProtocolAccess } from '@/utilities/checkProtocolAccess'
import { ProtocolAccessDenied } from '@/components/ProtocolAccessDenied'

export default async function ProtocolsPage() {
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

  // User has access, fetch protocols
  const payload = await getPayload({ config })

  const protocols = await payload.find({
    collection: 'protocols',
    where: {
      _status: { equals: 'published' },
    },
    sort: '_order',
    limit: 1,
  })

  // Redirect to the first protocol in the notebook view
  if (protocols.docs.length > 0) {
    redirect(`/protocols/${protocols.docs[0].protocolNumber}`)
  }

  // If no protocols exist, show a message
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">No Protocols Available</h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Please add protocols in the admin panel.
        </p>
      </div>
    </div>
  )
}
