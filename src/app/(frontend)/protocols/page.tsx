export const dynamic = 'force-dynamic'
export const revalidate = 0

import { getPayload } from 'payload'
import config from '@payload-config'
import { redirect } from 'next/navigation'

export default async function ProtocolsPage() {
  const payload = await getPayload({ config })

  const protocols = await payload.find({
    collection: 'protocols',
    where: {
      _status: { equals: 'published' },
    },
    sort: 'sortOrder',
    limit: 1,
  })

  // Redirect to the first protocol in the notebook view
  if (protocols.docs.length > 0) {
    redirect(`/protocols/${protocols.docs[0].id}`)
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
