export const dynamic = 'force-dynamic'
export const revalidate = 0

import { getPayload } from 'payload'
import config from '@payload-config'
import { getMeUser } from '@/utilities/getMeUser'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import type { Hospital, HospitalNetwork, Media } from '@/payload-types'
import { HospitalDetailCard } from './HospitalDetailCard'

interface HospitalDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function HospitalDetailPage({ params }: HospitalDetailPageProps) {
  const { id } = await params

  await getMeUser({
    nullUserRedirect: `/login?unauthorized=hospitals&redirect=${encodeURIComponent(`/hospitals/${id}`)}`,
  })

  const payload = await getPayload({ config })

  let hospital: Hospital | null = null
  try {
    const result = await payload.findByID({
      collection: 'hospitals',
      id,
      depth: 2,
    })
    hospital = result as Hospital
  } catch (_error) {
    notFound()
  }

  if (!hospital) {
    notFound()
  }

  const network =
    typeof hospital.network === 'object' ? (hospital.network as HospitalNetwork) : null
  const networkLogo = hospital.networkLogoOverride
    ? typeof hospital.networkLogoOverride === 'object'
      ? (hospital.networkLogoOverride as Media)
      : null
    : network?.logo && typeof network.logo === 'object'
      ? (network.logo as Media)
      : null

  const hydratedHospital = JSON.parse(JSON.stringify(hospital)) as Hospital
  const hydratedNetwork = network ? (JSON.parse(JSON.stringify(network)) as HospitalNetwork) : null
  const hydratedLogo = networkLogo ? (JSON.parse(JSON.stringify(networkLogo)) as Media) : null

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/hospitals"
          className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Hospitals
        </Link>

        <HospitalDetailCard
          hospital={hydratedHospital}
          network={hydratedNetwork}
          networkLogo={hydratedLogo}
        />
      </div>
    </div>
  )
}
