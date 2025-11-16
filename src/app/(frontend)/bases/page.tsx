export const dynamic = 'force-dynamic'
export const revalidate = 0

import { getPayload } from 'payload'
import config from '@payload-config'
import { getMeUser } from '@/utilities/getMeUser'
import type { Base } from '@/payload-types'
import { BasesClient } from './page.client'

export default async function BasesPage() {
  // Check authentication - redirect to login if not authenticated
  await getMeUser({
    nullUserRedirect: `/login?unauthorized=bases&redirect=${encodeURIComponent('/bases')}`,
  })

  // Fetch all bases
  const payload = await getPayload({ config })
  const basesResult = await payload.find({
    collection: 'bases',
    limit: 1000,
    sort: 'name',
  })

  const bases = basesResult.docs as Base[]

  return <BasesClient bases={bases} />
}
