export const dynamic = 'force-dynamic'
export const revalidate = 0

import { getPayload } from 'payload'
import config from '@payload-config'
import { getMeUser } from '@/utilities/getMeUser'
import type { Hospital, HospitalCapability } from '@/payload-types'
import { HospitalsClient } from './page.client'

export default async function HospitalsPage() {
  // Check authentication - redirect to login if not authenticated
  const { user } = await getMeUser({
    nullUserRedirect: `/login?unauthorized=hospitals&redirect=${encodeURIComponent('/hospitals')}`,
  })

  // Fetch all hospitals with their relationships
  const payload = await getPayload({ config })
  
  const [hospitalsResult, capabilitiesResult] = await Promise.all([
    payload.find({
      collection: 'hospitals',
      limit: 1000,
      sort: 'name',
      depth: 2, // Include network and capabilities
    }),
    payload.find({
      collection: 'hospital-capabilities',
      limit: 1000,
      sort: 'name',
    }),
  ])

  const hospitals = hospitalsResult.docs as Hospital[]
  const capabilities = capabilitiesResult.docs as HospitalCapability[]

  return <HospitalsClient hospitals={hospitals} capabilities={capabilities} />
}
