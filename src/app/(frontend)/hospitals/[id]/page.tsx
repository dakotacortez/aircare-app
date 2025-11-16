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
import { DoorCodeList } from '@/components/door-code-list'

interface HospitalDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function HospitalDetailPage({ params }: HospitalDetailPageProps) {
  const { id } = await params

  // Check authentication
  const { user } = await getMeUser({
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
  } catch (error) {
    notFound()
  }

  if (!hospital) {
    notFound()
  }

  const addressLine1 = hospital.address?.line1?.trim()
  const addressLine2 = hospital.address?.line2?.trim()
  const city = hospital.address?.city?.trim()
  const state = hospital.address?.state?.trim()
  const zip = hospital.address?.zip?.trim()
  const cityState = [city, state].filter(Boolean).join(', ')
  const cityStateZip = [cityState, zip].filter(Boolean).join(' ').trim()
  const hasAddressDetails = Boolean(addressLine1 || addressLine2 || city || state || zip)
  const addressSegmentsForMap = [addressLine1, addressLine2, cityStateZip].filter(
    (segment) => segment && segment.length > 0,
  )
  const addressQuery = addressSegmentsForMap.join(', ')
  const lat = typeof hospital.latitude === 'number' ? hospital.latitude : null
  const lng = typeof hospital.longitude === 'number' ? hospital.longitude : null
  const hasCoordinates = typeof lat === 'number' && typeof lng === 'number'
  const navigationUrl = hasCoordinates
    ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
    : addressQuery
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressQuery)}`
      : null
  const addressLineContent = (
    <div className="mt-1 text-neutral-600 dark:text-neutral-400">
      {addressLine1 && <div>{addressLine1}</div>}
      {addressLine2 && <div>{addressLine2}</div>}
      {(city || state || zip) && (
        <div>
          {city}
          {city && state && ', '}
          {state}
          {state && zip && ' '}
          {zip}
        </div>
      )}
    </div>
  )
  const coordinatesContent = hasCoordinates ? (
    <div className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
      Coordinates: {lat}, {lng}
    </div>
  ) : null
  const contactCardClassName =
    'group relative block overflow-hidden rounded-2xl border border-blue-200/70 bg-gradient-to-br from-blue-50/70 via-white to-blue-100/60 p-4 text-left shadow-[0_15px_35px_-25px_rgba(37,99,235,0.65)] transition duration-300 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-[0_25px_45px_-30px_rgba(37,99,235,0.85)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 dark:border-blue-900/70 dark:from-blue-950/30 dark:via-blue-900/20 dark:to-blue-950/10 dark:hover:border-blue-800'
  const otherContactEntries = Array.isArray(hospital.otherPhones)
    ? hospital.otherPhones.filter((entry) => entry?.phoneNumber?.trim())
    : []

  const network =
    typeof hospital.network === 'object' ? (hospital.network as HospitalNetwork) : null
  const networkLogo = hospital.networkLogoOverride
    ? typeof hospital.networkLogoOverride === 'object'
      ? (hospital.networkLogoOverride as Media)
      : null
    : network?.logo && typeof network.logo === 'object'
      ? (network.logo as Media)
      : null

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
          <div className="rounded-3xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/80 dark:bg-neutral-900/60 shadow-xl shadow-neutral-900/5 dark:shadow-black/40 backdrop-blur-sm overflow-hidden">
          {/* Address Section */}
          {hasAddressDetails && (
            <div className="p-6 border-b border-neutral-100/70 dark:border-neutral-800/70">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0 text-neutral-500 dark:text-neutral-400" />
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    Address
                  </h2>
                  {navigationUrl ? (
                    <a
                      href={navigationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 block rounded-2xl border border-neutral-200/70 bg-white/80 px-4 py-3 text-left transition hover:border-blue-400 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 dark:border-neutral-800/70 dark:bg-neutral-900/40"
                      aria-label={`Open directions to ${hospital.name ?? 'this hospital'} in your maps app`}
                    >
                      {addressLineContent}
                      {coordinatesContent}
                      <span className="mt-3 inline-flex text-sm font-medium text-blue-600 dark:text-blue-400">
                        Open in Maps
                      </span>
                    </a>
                  ) : (
                    <>
                      {addressLineContent}
                      {coordinatesContent}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Squad Phone */}
          {hospital.squadPhone && (
              <div className="p-6 border-b border-neutral-100/70 dark:border-neutral-800/70">
                <div className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-5 w-5 flex-shrink-0 text-neutral-500 dark:text-neutral-400" />
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                      Squad Phone
                    </h2>
                    <a
                      href={`tel:${hospital.squadPhone}`}
                      className={`${contactCardClassName} mt-3`}
                      aria-label={`Call the squad phone at ${hospital.squadPhone}`}
                    >
                      <span className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-blue-900/70 dark:text-blue-100/70">
                        Primary Contact
                      </span>
                      <span className="mt-2 block text-2xl font-semibold tracking-tight text-blue-900 dark:text-blue-100">
                        {hospital.squadPhone}
                      </span>
                      <span className="mt-3 inline-flex text-sm font-medium text-blue-700 dark:text-blue-300">
                        Tap to dial
                      </span>
                    </a>
                  </div>
                </div>
              </div>
          )}

          {/* Other Phone Numbers */}
          {otherContactEntries.length > 0 && (
            <div className="p-6 border-b border-neutral-100/70 dark:border-neutral-800/70">
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-5 w-5 flex-shrink-0 text-neutral-500 dark:text-neutral-400" />
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    Other Contacts
                  </h2>
                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {otherContactEntries.map((phone, idx) => {
                        const label = phone?.label?.trim() || `Contact ${idx + 1}`
                        const phoneNumber = phone?.phoneNumber?.trim()
                        if (!phoneNumber) {
                          return null
                        }

                        return (
                          <a
                            key={`${label}-${phoneNumber}-${idx}`}
                            href={`tel:${phoneNumber}`}
                            className={contactCardClassName}
                            aria-label={`Call ${label} at ${phoneNumber}`}
                          >
                            <span className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-blue-900/70 dark:text-blue-100/70">
                              {label}
                            </span>
                            <span className="mt-2 block text-xl font-semibold tracking-tight text-blue-900 dark:text-blue-100">
                              {phoneNumber}
                            </span>
                            <span className="mt-3 inline-flex text-sm font-medium text-blue-700 dark:text-blue-300">
                              Tap to dial
                            </span>
                          </a>
                        )
                      })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Door Codes */}
          {hospital.doorCodes && hospital.doorCodes.length > 0 && (
              <div className="p-6 border-b border-neutral-100/70 dark:border-neutral-800/70">
              <div className="flex items-start gap-3">
                <Key className="h-5 w-5 text-neutral-500 dark:text-neutral-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
                    Door Codes
                  </h2>
                    <DoorCodeList doorCodes={hospital.doorCodes} />
                </div>
              </div>
            </div>
          )}

          {/* Capabilities */}
          {hospital.capabilities && hospital.capabilities.length > 0 && (
              <div className="p-6 border-b border-neutral-100/70 dark:border-neutral-800/70">
              <div className="flex items-start gap-3">
                <Award className="h-5 w-5 text-neutral-500 dark:text-neutral-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
                    Clinical Capabilities
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {hospital.capabilities.map((cap, idx) => {
                      const capability =
                        typeof cap.capability === 'object'
                          ? (cap.capability as HospitalCapability)
                          : null
                      if (!capability) return null

                      const normalizedLevel = cap.level ? cap.level.toLowerCase().trim() : null
                      const levelDetails =
                        normalizedLevel && capability.levels
                          ? capability.levels.find((levelOption) => {
                              if (!levelOption.level) return false
                              return levelOption.level.toLowerCase().trim() === normalizedLevel
                            })
                          : null
                      const levelDescription = levelDetails?.description?.trim()

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
                          {levelDescription && (
                            <div className="text-sm text-emerald-600 dark:text-emerald-200/90 mt-0.5">
                              {levelDescription}
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
