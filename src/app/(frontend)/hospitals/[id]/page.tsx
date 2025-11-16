export const dynamic = 'force-dynamic'
export const revalidate = 0

import { getPayload } from 'payload'
import config from '@payload-config'
import { getMeUser } from '@/utilities/getMeUser'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MapPin, Phone, Key, Award, FileText, ChevronLeft } from 'lucide-react'
import type { Hospital, HospitalNetwork, HospitalCapability, Media } from '@/payload-types'
import Image from 'next/image'

interface HospitalDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function HospitalDetailPage({ params }: HospitalDetailPageProps) {
  const { id } = await params

  // Check authentication
  await getMeUser({
    nullUserRedirect: `/login?unauthorized=hospitals&redirect=${encodeURIComponent(`/hospitals/${id}`)}`,
  })

  // Fetch the hospital
  const payload = await getPayload({ config })
  
  let hospital: Hospital | null = null
  try {
    const result = await payload.findByID({
      collection: 'hospitals',
      id,
      depth: 2, // Include network, capabilities, and media
    })
    hospital = result as Hospital
  } catch {
    notFound()
  }

  if (!hospital) {
    notFound()
  }

  const network = typeof hospital.network === 'object' ? hospital.network as HospitalNetwork : null
  const networkLogo = hospital.networkLogoOverride 
    ? (typeof hospital.networkLogoOverride === 'object' ? hospital.networkLogoOverride as Media : null)
    : network?.logo && typeof network.logo === 'object' ? network.logo as Media : null

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          href="/hospitals"
          className="inline-flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 mb-6"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Hospitals
        </Link>

        {/* Hospital Header */}
        <div className="mb-6 flex items-start gap-4">
          {networkLogo?.url && (
            <div className="flex-shrink-0">
              <Image
                src={networkLogo.url}
                alt={network?.name || 'Hospital logo'}
                width={80}
                height={80}
                className="rounded-lg"
              />
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
              {hospital.name}
            </h1>
            {network && (
              <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
                {network.name}
              </span>
            )}
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white dark:bg-neutral-800 border dark:border-neutral-700 rounded-2xl shadow-sm overflow-hidden">
          {/* Address Section */}
          {hospital.address && (
            <div className="p-6 border-b dark:border-neutral-700">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-neutral-500 dark:text-neutral-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                    Address
                  </h2>
                  <div className="text-neutral-600 dark:text-neutral-400">
                    {hospital.address.line1 && <div>{hospital.address.line1}</div>}
                    {hospital.address.line2 && <div>{hospital.address.line2}</div>}
                    {(hospital.address.city || hospital.address.state || hospital.address.zip) && (
                      <div>
                        {hospital.address.city}
                        {hospital.address.city && hospital.address.state && ', '}
                        {hospital.address.state} {hospital.address.zip}
                      </div>
                    )}
                  </div>
                  {(hospital.latitude || hospital.longitude) && (
                    <div className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                      Coordinates: {hospital.latitude}, {hospital.longitude}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Squad Phone */}
          {hospital.squadPhone && (
            <div className="p-6 border-b dark:border-neutral-700">
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-neutral-500 dark:text-neutral-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                    Squad Phone
                  </h2>
                  <a
                    href={`tel:${hospital.squadPhone}`}
                    className="text-lg text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {hospital.squadPhone}
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Other Phone Numbers */}
          {hospital.otherPhones && hospital.otherPhones.length > 0 && (
            <div className="p-6 border-b dark:border-neutral-700">
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-neutral-500 dark:text-neutral-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
                    Other Contacts
                  </h2>
                  <div className="space-y-2">
                    {hospital.otherPhones.map((phone, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900"
                      >
                        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                          {phone.label}
                        </span>
                        <a
                          href={`tel:${phone.phoneNumber}`}
                          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {phone.phoneNumber}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Door Codes */}
          {hospital.doorCodes && hospital.doorCodes.length > 0 && (
            <div className="p-6 border-b dark:border-neutral-700">
              <div className="flex items-start gap-3">
                <Key className="h-5 w-5 text-neutral-500 dark:text-neutral-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
                    Door Codes
                  </h2>
                  <div className="space-y-2">
                    {hospital.doorCodes.map((doorCode, idx) => (
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

          {/* Capabilities */}
          {hospital.capabilities && hospital.capabilities.length > 0 && (
            <div className="p-6 border-b dark:border-neutral-700">
              <div className="flex items-start gap-3">
                <Award className="h-5 w-5 text-neutral-500 dark:text-neutral-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
                    Clinical Capabilities
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {hospital.capabilities.map((cap, idx) => {
                      const capability = typeof cap.capability === 'object' ? cap.capability as HospitalCapability : null
                      if (!capability) return null

                      return (
                        <div
                          key={idx}
                          className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800"
                        >
                          <div className="font-medium text-emerald-900 dark:text-emerald-100">
                            {capability.name}
                          </div>
                          {cap.level && (
                            <div className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">
                              {cap.level}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {hospital.notes && (
            <div className="p-6">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-neutral-500 dark:text-neutral-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                    Notes
                  </h2>
                  <p className="text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap">
                    {hospital.notes}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Timestamps and Attribution */}
        {(hospital.createdAt || hospital.updatedAt || hospital.createdBy || hospital.updatedBy) && (
          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-neutral-500 dark:text-neutral-400">
            {hospital.createdAt && (
              <span>Created: {new Date(hospital.createdAt).toLocaleDateString()}</span>
            )}
            {hospital.updatedAt && (
              <span>Updated: {new Date(hospital.updatedAt).toLocaleDateString()}</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
