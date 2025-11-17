export const dynamic = 'force-dynamic'
export const revalidate = 0

import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, Sparkles } from 'lucide-react'
import { getMeUser } from '@/utilities/getMeUser'
import type { Hospital } from '@/payload-types'
import { HospitalChangeRequestForm } from '../HospitalChangeRequestForm'

interface HospitalSuggestUpdatePageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function HospitalSuggestUpdatePage({ params }: HospitalSuggestUpdatePageProps) {
  const { slug } = await params

  await getMeUser({
    nullUserRedirect: `/login?unauthorized=hospitals&redirect=${encodeURIComponent(`/hospitals/${slug}/suggest-update`)}`,
  })

  const payload = await getPayload({ config })

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

  if (!result.docs?.length) {
    notFound()
  }

  const hospital = result.docs[0] as Hospital
  const hydratedHospital = JSON.parse(JSON.stringify(hospital)) as Hospital

  return (
    <div className="min-h-screen bg-uc-light-bg text-uc-text-light-default transition-colors dark:bg-uc-dark-bg dark:text-uc-text-dark-default">
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href={`/hospitals/${slug}`}
          className="inline-flex items-center gap-2 text-sm text-uc-text-light-muted transition hover:text-uc-text-light-default dark:text-uc-text-dark-muted dark:hover:text-uc-text-dark-default"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to hospital profile
        </Link>

        <div className="rounded-3xl bg-uc-light-card ring-1 ring-uc-light-border dark:bg-neutral-800 dark:ring-neutral-700">
          <div className="flex items-start gap-3 px-4 pb-4 pt-5 sm:px-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-uc-text-light-muted dark:text-uc-text-dark-muted">
                Suggest update
              </p>
              <h1 className="text-xl font-bold leading-tight sm:text-2xl">{hospital.name}</h1>
              <p className="mt-1 text-sm text-uc-text-light-muted dark:text-uc-text-dark-muted">
                Send corrections or new details to the content team. Approved changes will update this hospital automatically.
              </p>
            </div>
          </div>
          <div className="border-t border-uc-light-border bg-uc-light-subtle/60 px-4 py-3 text-sm text-uc-text-light-muted dark:border-neutral-700 dark:bg-neutral-900/40 dark:text-uc-text-dark-muted sm:px-6">
            We&apos;ll include your account so the team can follow up if they have questions.
          </div>
        </div>

        <HospitalChangeRequestForm hospital={hydratedHospital} />
      </div>
    </div>
  )
}
