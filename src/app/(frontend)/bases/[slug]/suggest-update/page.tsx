export const dynamic = 'force-dynamic'
export const revalidate = 0

import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, Wrench } from 'lucide-react'
import { getMeUser } from '@/utilities/getMeUser'
import type { Base, Asset } from '@/payload-types'
import { BaseChangeRequestForm } from '../BaseChangeRequestForm'

interface BaseSuggestUpdatePageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function BaseSuggestUpdatePage({ params }: BaseSuggestUpdatePageProps) {
  const { slug } = await params

  await getMeUser({
    nullUserRedirect: `/login?unauthorized=bases&redirect=${encodeURIComponent(`/bases/${slug}/suggest-update`)}`,
  })

  const payload = await getPayload({ config })

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

  if (!result.docs?.length) {
    notFound()
  }

  const assetsResult = await payload.find({
    collection: 'assets',
    limit: 200,
  })

  const base = result.docs[0] as Base
  const hydratedBase = JSON.parse(JSON.stringify(base)) as Base
  const assets = JSON.parse(JSON.stringify(assetsResult.docs)) as Asset[]

  return (
    <div className="min-h-screen bg-uc-light-bg text-uc-text-light-default transition-colors dark:bg-uc-dark-bg dark:text-uc-text-dark-default">
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href={`/bases/${slug}`}
          className="inline-flex items-center gap-2 text-sm text-uc-text-light-muted transition hover:text-uc-text-light-default dark:text-uc-text-dark-muted dark:hover:text-uc-text-dark-default"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to base profile
        </Link>

        <div className="rounded-3xl bg-uc-light-card ring-1 ring-uc-light-border dark:bg-neutral-800 dark:ring-neutral-700">
          <div className="flex items-start gap-3 px-4 pb-4 pt-5 sm:px-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200">
              <Wrench className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-uc-text-light-muted dark:text-uc-text-dark-muted">
                Suggest update
              </p>
              <h1 className="text-xl font-bold leading-tight sm:text-2xl">{base.name}</h1>
              <p className="mt-1 text-sm text-uc-text-light-muted dark:text-uc-text-dark-muted">
                Share updated contact, access, or location details. Approved changes will update this base automatically.
              </p>
            </div>
          </div>
          <div className="border-t border-uc-light-border bg-uc-light-subtle/60 px-4 py-3 text-sm text-uc-text-light-muted dark:border-neutral-700 dark:bg-neutral-900/40 dark:text-uc-text-dark-muted sm:px-6">
            We&apos;ll include your account so the team can follow up if they have questions.
          </div>
        </div>

        <BaseChangeRequestForm base={hydratedBase} assets={assets} />
      </div>
    </div>
  )
}
