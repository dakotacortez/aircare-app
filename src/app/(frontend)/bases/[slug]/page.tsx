export const dynamic = 'force-dynamic'
export const revalidate = 0

import { getPayload } from 'payload'
import config from '@payload-config'
import { getMeUser } from '@/utilities/getMeUser'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import type { Base, HospitalNetwork, Media } from '@/payload-types'
import { BaseDetailCard } from './BaseDetailCard'

interface BaseDetailPageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function BaseDetailPage({ params }: BaseDetailPageProps) {
  const { slug } = await params

  // Check authentication
  await getMeUser({
    nullUserRedirect: `/login?unauthorized=bases&redirect=${encodeURIComponent(`/bases/${slug}`)}`,
  })

  // Fetch the base
  const payload = await getPayload({ config })
  
  let base: Base | null = null
  try {
    const result = await payload.find({
      collection: 'bases',
      where: {
        slug: {
          equals: slug,
        },
      },
      depth: 2,
      limit: 1,
    })
    
    if (result.docs.length > 0) {
      base = result.docs[0] as Base
    } else {
      notFound()
    }
  } catch (_error) {
    notFound()
  }

  if (!base) {
    notFound()
  }

  const network =
    typeof base.network === 'object' ? (base.network as HospitalNetwork) : null
  const networkLogo = base.networkLogoOverride
    ? typeof base.networkLogoOverride === 'object'
      ? (base.networkLogoOverride as Media)
      : null
    : network?.logo && typeof network.logo === 'object'
      ? (network.logo as Media)
      : null

  const hydratedBase = JSON.parse(JSON.stringify(base)) as Base
  const hydratedNetwork = network ? (JSON.parse(JSON.stringify(network)) as HospitalNetwork) : null
  const hydratedLogo = networkLogo ? (JSON.parse(JSON.stringify(networkLogo)) as Media) : null

  return (
    <div className="min-h-screen bg-uc-light-bg text-uc-text-light-default transition-colors dark:bg-neutral-900 dark:text-uc-text-dark-default">
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/bases"
          className="inline-flex items-center gap-2 text-sm text-uc-text-light-muted transition hover:text-uc-text-light-default dark:text-uc-text-dark-muted dark:hover:text-uc-text-dark-default"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Bases
        </Link>

        <BaseDetailCard
          base={hydratedBase}
          network={hydratedNetwork}
          networkLogo={hydratedLogo}
        />
      </div>
    </div>
  )
}
