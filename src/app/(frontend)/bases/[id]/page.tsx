export const dynamic = 'force-dynamic'
export const revalidate = 0

import { getPayload } from 'payload'
import config from '@payload-config'
import { getMeUser } from '@/utilities/getMeUser'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MapPin, Phone, Key, Truck, FileText, ChevronLeft } from 'lucide-react'
import type { Base } from '@/payload-types'

interface BaseDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function BaseDetailPage({ params }: BaseDetailPageProps) {
  const { id } = await params

  // Check authentication
  const { user } = await getMeUser({
    nullUserRedirect: `/login?unauthorized=bases&redirect=${encodeURIComponent(`/bases/${id}`)}`,
  })

  // Fetch the base
  const payload = await getPayload({ config })
  
  let base: Base | null = null
  try {
    const result = await payload.findByID({
      collection: 'bases',
      id,
    })
    base = result as Base
  } catch (error) {
    notFound()
  }

  if (!base) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          href="/bases"
          className="inline-flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 mb-6"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Bases
        </Link>

        {/* Base Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
            {base.name}
          </h1>
        </div>

        {/* Main Content Card */}
        <div className="bg-white dark:bg-neutral-800 border dark:border-neutral-700 rounded-2xl shadow-sm overflow-hidden">
          {/* Address Section */}
          {base.address && (
            <div className="p-6 border-b dark:border-neutral-700">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-neutral-500 dark:text-neutral-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                    Address
                  </h2>
                  <div className="text-neutral-600 dark:text-neutral-400">
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
                  {(base.latitude || base.longitude) && (
                    <div className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                      Coordinates: {base.latitude}, {base.longitude}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Contact Information */}
          {base.contactInfo && base.contactInfo.length > 0 && (
            <div className="p-6 border-b dark:border-neutral-700">
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-neutral-500 dark:text-neutral-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
                    Contact Information
                  </h2>
                  <div className="space-y-2">
                    {base.contactInfo.map((contact, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900"
                      >
                        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                          {contact.label}
                        </span>
                        <a
                          href={`tel:${contact.phoneNumber}`}
                          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {contact.phoneNumber}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Door Codes */}
          {base.doorCodes && base.doorCodes.length > 0 && (
            <div className="p-6 border-b dark:border-neutral-700">
              <div className="flex items-start gap-3">
                <Key className="h-5 w-5 text-neutral-500 dark:text-neutral-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
                    Door Codes
                  </h2>
                  <div className="space-y-2">
                    {base.doorCodes.map((doorCode, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
                      >
                        <code className="text-sm font-mono text-amber-900 dark:text-amber-100">
                          {doorCode.code}
                        </code>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Assets Based Here */}
          {base.assetsBasedThere && base.assetsBasedThere.length > 0 && (
            <div className="p-6 border-b dark:border-neutral-700">
              <div className="flex items-start gap-3">
                <Truck className="h-5 w-5 text-neutral-500 dark:text-neutral-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
                    Assets Based Here
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {base.assetsBasedThere.map((asset, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-sm font-medium text-blue-900 dark:text-blue-100"
                      >
                        {asset.assetName}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {base.notes && (
            <div className="p-6">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-neutral-500 dark:text-neutral-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                    Notes
                  </h2>
                  <p className="text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap">
                    {base.notes}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Timestamps */}
        {(base.createdAt || base.updatedAt) && (
          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-neutral-500 dark:text-neutral-400">
            {base.createdAt && (
              <span>Created: {new Date(base.createdAt).toLocaleDateString()}</span>
            )}
            {base.updatedAt && (
              <span>Updated: {new Date(base.updatedAt).toLocaleDateString()}</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
