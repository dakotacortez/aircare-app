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
    slug: string
  }>
}

export default async function HospitalDetailPage({ params }: HospitalDetailPageProps) {
  const { slug } = await params

  await getMeUser({
    nullUserRedirect: `/login?unauthorized=hospitals&redirect=${encodeURIComponent(`/hospitals/${slug}`)}`,
  })

  const payload = await getPayload({ config })

  let hospital: Hospital | null = null
  try {
    const result = await payload.find({
      collection: 'hospitals',
      where: {
        slug: {
          equals: slug,
        },
      },
      depth: 2,
      limit: 1,
    })
    
    if (result.docs.length > 0) {
      hospital = result.docs[0] as Hospital
    } else {
      notFound()
    }
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
      <div className="min-h-screen bg-uc-light-bg text-uc-text-light-default transition-colors dark:bg-uc-dark-bg dark:text-uc-text-dark-default">
        <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
          <Link
            href="/hospitals"
            className="inline-flex items-center gap-2 text-sm text-uc-text-light-muted transition hover:text-uc-text-light-default dark:text-uc-text-dark-muted dark:hover:text-uc-text-dark-default"
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
