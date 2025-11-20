export const dynamic = 'force-dynamic'
export const revalidate = 0

import Link from 'next/link'
import { ChevronLeft, Sparkles } from 'lucide-react'
import { getMeUser } from '@/utilities/getMeUser'
import type { Base } from '@/payload-types'
import { BaseChangeRequestForm } from '../bases/[slug]/BaseChangeRequestForm'

export default async function SuggestBasePage() {
  await getMeUser({
    nullUserRedirect: `/login?unauthorized=bases&redirect=${encodeURIComponent('/suggest-base')}`,
  })

  // Create an empty base object for the "add" form
  const emptyBase: Base = {
    id: 0,
    name: '',
    slug: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      zip: '',
    },
    coordinates: '',
    latitude: null,
    longitude: null,
    squadPhone: '',
    contactInfo: [],
    doorCodes: [],
    notes: '',
    hazards: [],
    sourceAttribution: '',
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  }

  return (
    <div className="min-h-screen bg-uc-light-bg text-uc-text-light-default transition-colors dark:bg-uc-dark-bg dark:text-uc-text-dark-default">
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/bases"
          className="inline-flex items-center gap-2 text-sm text-uc-text-light-muted transition hover:text-uc-text-light-default dark:text-uc-text-dark-muted dark:hover:text-uc-text-dark-default"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to bases directory
        </Link>

        <div className="rounded-3xl bg-uc-light-card ring-1 ring-uc-light-border dark:bg-neutral-800 dark:ring-neutral-700">
          <div className="flex items-start gap-3 px-4 pb-4 pt-5 sm:px-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-uc-text-light-muted dark:text-uc-text-dark-muted">
                Suggest new base
              </p>
              <h1 className="text-xl font-bold leading-tight sm:text-2xl">Add Base to Directory</h1>
              <p className="mt-1 text-sm text-uc-text-light-muted dark:text-uc-text-dark-muted">
                Submit a new air medical base to the directory. The content team will review and approve your submission.
              </p>
            </div>
          </div>
          <div className="border-t border-uc-light-border bg-uc-light-subtle/60 px-4 py-3 text-sm text-uc-text-light-muted dark:border-neutral-700 dark:bg-neutral-900/40 dark:text-uc-text-dark-muted sm:px-6">
            We&apos;ll include your account so the team can follow up if they have questions.
          </div>
        </div>

        <BaseChangeRequestForm base={emptyBase} />
      </div>
    </div>
  )
}
