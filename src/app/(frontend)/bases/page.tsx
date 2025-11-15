export const dynamic = 'force-dynamic'
export const revalidate = 0

import { getPayload } from 'payload'
import config from '@payload-config'
import { getMeUser } from '@/utilities/getMeUser'
import Link from 'next/link'
import { MapPin, Phone, FileText } from 'lucide-react'
import type { Base, Asset } from '@/payload-types'

export default async function BasesPage() {
  // Check authentication - redirect to login if not authenticated
  const { user } = await getMeUser({
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

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
            Base Locations
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            EMS base locations and station information
          </p>
        </div>

        {/* Bases Grid */}
        {bases.length === 0 ? (
          <div className="bg-white dark:bg-neutral-800 border dark:border-neutral-700 rounded-2xl shadow-sm p-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-neutral-400 mb-4" />
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
              No Bases Available
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              Base information will appear here when added.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bases.map((base) => (
              <Link
                key={base.id}
                href={`/bases/${base.id}`}
                className="bg-white dark:bg-neutral-800 border dark:border-neutral-700 rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                {/* Base Name */}
                <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">
                  {base.name}
                </h2>

                {/* Address */}
                {base.address && (
                  <div className="flex items-start gap-2 text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div>
                      {base.address.line1 && <div>{base.address.line1}</div>}
                      {base.address.line2 && <div>{base.address.line2}</div>}
                      {(base.address.city || base.address.state || base.address.zip) && (
                        <div>
                          {base.address.city}
                          {base.address.city && base.address.state && ', '}
                          {base.address.state} {base.address.zip}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Contact Info Preview */}
                {base.contactInfo && base.contactInfo.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                    <Phone className="h-4 w-4 flex-shrink-0" />
                    <span>
                      {base.contactInfo.length} contact{base.contactInfo.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}

                {/* Assets Preview */}
                {base.assets && base.assets.length > 0 && (
                  <div className="mt-3 pt-3 border-t dark:border-neutral-700">
                    <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                      Assets:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {base.assets.slice(0, 3).map((assetRef, idx) => {
                        const asset = typeof assetRef === 'object' ? assetRef : null
                        if (!asset) return null

                        return (
                          <span
                            key={idx}
                            className="inline-block px-2 py-1 text-xs rounded-md bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300"
                          >
                            {asset.name}
                          </span>
                        )
                      })}
                      {base.assets.length > 3 && (
                        <span className="inline-block px-2 py-1 text-xs text-neutral-500 dark:text-neutral-400">
                          +{base.assets.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
