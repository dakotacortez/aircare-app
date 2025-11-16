'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { MapPin, Building2, Navigation, Filter } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Hospital, HospitalNetwork, HospitalCapability } from '@/payload-types'
import { calculateDistanceMiles, estimateEtaMinutes } from '@/utilities/distance'
import { capabilityColors } from './capabilityColors'

interface HospitalsClientProps {
  hospitals: Hospital[]
  capabilities: HospitalCapability[]
}

interface HospitalWithDistance extends Hospital {
  distance?: number
  eta?: number
}

const buildAddressSummary = (hospital: Hospital) => {
  const line1 = hospital.address?.line1?.trim()
  const city = hospital.address?.city?.trim()
  const state = hospital.address?.state?.trim()
  if (city || state) {
    return [city, state].filter(Boolean).join(', ')
  }
  return line1 ?? null
}

const buildNavigationUrl = (hospital: Hospital) => {
  const lat = typeof hospital.latitude === 'number' ? hospital.latitude : null
  const lng = typeof hospital.longitude === 'number' ? hospital.longitude : null
  if (lat !== null && lng !== null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
  }
  const parts = [
    hospital.address?.line1?.trim(),
    hospital.address?.line2?.trim(),
    hospital.address?.city?.trim(),
    hospital.address?.state?.trim(),
    hospital.address?.zip?.trim(),
  ].filter(Boolean)
  if (!parts.length) {
    return null
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts.join(', '))}`
}

const getPrimaryDoorCode = (hospital: Hospital) => {
  const doorCodes = hospital.doorCodes ?? []
  return doorCodes.find((code) => code?.isPrimary) ?? doorCodes[0] ?? null
}

export function HospitalsClient({ hospitals, capabilities }: HospitalsClientProps) {
  const [selectedCapabilities, setSelectedCapabilities] = useState<number[]>([])
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)

  const getCapabilityLevelDescription = (
    capability: HospitalCapability,
    capabilityLevel?: string | null,
  ) => {
    if (!capability?.levels || !capabilityLevel) return null
    const normalizedLevel = capabilityLevel.toLowerCase().trim()
    const levelDetails = capability.levels.find((levelOption) => {
      if (!levelOption.level) return false
      return levelOption.level.toLowerCase().trim() === normalizedLevel
    })
    return levelDetails?.description?.trim() ?? null
  }

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Get user location on mobile
  useEffect(() => {
    if (!isMobile) return

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          })
          setLocationError(null)
        },
        (error) => {
          console.error('Geolocation error:', error)
          setLocationError('Location access denied')
        },
      )
    } else {
      setLocationError('Geolocation not supported')
    }
  }, [isMobile])

  // Calculate distances and filter hospitals
  const processedHospitals = useMemo(() => {
      let processed: HospitalWithDistance[] = hospitals.map((hospital) => {
        const result: HospitalWithDistance = { ...hospital }

        if (
          userLocation &&
          typeof hospital.latitude === 'number' &&
          typeof hospital.longitude === 'number'
        ) {
          const distance = calculateDistanceMiles(
            userLocation.lat,
            userLocation.lon,
            hospital.latitude,
            hospital.longitude,
          )
          result.distance = distance
          result.eta = estimateEtaMinutes(distance)
        }

        return result
      })

      // Filter by capabilities
      if (selectedCapabilities.length > 0) {
        processed = processed.filter((hospital) => {
          if (!hospital.capabilities || hospital.capabilities.length === 0) return false

          return selectedCapabilities.every((selectedCapId) =>
            hospital.capabilities?.some((cap) => {
              const capability = typeof cap.capability === 'object' ? cap.capability : null
              return capability?.id === selectedCapId
            }),
          )
        })
      }

      // Sort by distance if location is available
      if (userLocation) {
        processed.sort((a, b) => {
          if (a.distance !== undefined && b.distance !== undefined) {
            return a.distance - b.distance
          }
          return 0
        })
      }

      return processed
    }, [hospitals, selectedCapabilities, userLocation])

  const toggleCapability = (capabilityId: number) => {
    setSelectedCapabilities((prev) =>
      prev.includes(capabilityId)
        ? prev.filter((id) => id !== capabilityId)
        : [...prev, capabilityId],
    )
  }

  const clearFilters = () => {
    setSelectedCapabilities([])
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
            Hospital Directory
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Hospital information, contacts, and capabilities
          </p>
        </div>

        {/* Location Status (Mobile Only) */}
        {isMobile && (
          <div className="mb-4">
            {userLocation ? (
              <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                <Navigation className="h-4 w-4" />
                <span>Sorted by distance from your location</span>
              </div>
            ) : locationError ? (
              <div className="text-sm text-amber-600 dark:text-amber-400">
                {locationError} - showing all hospitals
              </div>
            ) : (
              <div className="text-sm text-neutral-500 dark:text-neutral-400">
                Getting your location...
              </div>
            )}
          </div>
        )}

        {/* Filter Section */}
        <div className="mb-6">
          {/* Mobile Filter Button */}
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className="md:hidden w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-neutral-800 border dark:border-neutral-700 rounded-xl shadow-sm mb-4"
          >
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="font-medium">Filter by Capability</span>
              {selectedCapabilities.length > 0 && (
                <span className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full">
                  {selectedCapabilities.length}
                </span>
              )}
            </div>
          </button>

          {/* Filter Content */}
          <div
            className={`${filterOpen || !isMobile ? 'block' : 'hidden'} bg-white dark:bg-neutral-800 border dark:border-neutral-700 rounded-xl shadow-sm p-4`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-neutral-500" />
                <span className="font-medium text-sm">Filter by Capability</span>
              </div>
              {selectedCapabilities.length > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {capabilities.map((capability) => {
                const isSelected = selectedCapabilities.includes(capability.id)
                return (
                  <button
                    key={capability.id}
                    onClick={() => toggleCapability(capability.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600'
                    }`}
                  >
                    {capability.name}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 text-sm text-neutral-600 dark:text-neutral-400">
          {processedHospitals.length} hospital{processedHospitals.length !== 1 ? 's' : ''} found
        </div>

        {/* Hospitals Grid */}
        {processedHospitals.length === 0 ? (
          <div className="rounded-2xl border bg-white p-12 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <Building2 className="mx-auto mb-4 h-12 w-12 text-neutral-400" />
            <h2 className="mb-2 text-xl font-semibold text-neutral-900 dark:text-white">
              No Hospitals Found
            </h2>
            <p className="mb-4 text-neutral-600 dark:text-neutral-400">
              {selectedCapabilities.length > 0
                ? 'Try adjusting your filters'
                : 'Hospital information will appear here when added.'}
            </p>
            {selectedCapabilities.length > 0 && (
              <button
                onClick={clearFilters}
                className="text-blue-600 underline-offset-2 hover:underline dark:text-blue-400"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {processedHospitals.map((hospital) => {
              const network =
                typeof hospital.network === 'object' ? (hospital.network as HospitalNetwork) : null
              const capabilityBadges =
                hospital.capabilities
                  ?.map((cap, idx) => {
                    const capability =
                      typeof cap.capability === 'object' ? (cap.capability as HospitalCapability) : null
                    if (!capability) return null
                    const color = capabilityColors[capability.category ?? 'other'] ?? capabilityColors.other
                    return {
                      id: `${hospital.id}-${idx}`,
                      name: capability.name,
                      level: cap.level,
                      description: getCapabilityLevelDescription(capability, cap.level),
                      color,
                    }
                  })
                  .filter(Boolean) ?? []
              const badgesToDisplay = capabilityBadges.slice(0, 3)
              const moreCapabilities = Math.max(capabilityBadges.length - badgesToDisplay.length, 0)
              const primaryDoorCode = getPrimaryDoorCode(hospital)
              const addressSummary = buildAddressSummary(hospital)
              const navigationUrl = buildNavigationUrl(hospital)

              return (
                <motion.article
                  key={hospital.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-3xl bg-white/90 p-6 shadow-xl ring-1 ring-slate-100 backdrop-blur dark:bg-neutral-900/90 dark:ring-neutral-800"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
                        {hospital.name}
                      </h2>
                      {network && (
                        <span className="mt-1 inline-flex items-center rounded-full bg-blue-100 px-3 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-900/40 dark:text-blue-100">
                          {network.name}
                        </span>
                      )}
                      {addressSummary && (
                        <p className="mt-2 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                          <MapPin className="h-4 w-4" />
                          <span>{addressSummary}</span>
                        </p>
                      )}
                    </div>
                    {hospital.eta !== undefined && hospital.distance !== undefined && (
                      <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-100">
                        <Navigation className="h-4 w-4" />
                        <span>
                          ETA {hospital.eta} min • {hospital.distance.toFixed(1)} mi
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-900/60">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                        Squad Phone
                      </p>
                      {hospital.squadPhone ? (
                        <a
                          href={`tel:${hospital.squadPhone}`}
                          className="mt-1 inline-flex text-lg font-semibold text-slate-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-300"
                        >
                          {hospital.squadPhone}
                        </a>
                      ) : (
                        <p className="mt-1 text-sm text-slate-400">Not set</p>
                      )}
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-900/60">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                        ED Door Code
                      </p>
                      <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                        {primaryDoorCode?.code ?? '—'}
                      </p>
                      {primaryDoorCode?.label && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">{primaryDoorCode.label}</p>
                      )}
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-900/60">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                        Capabilities
                      </p>
                      <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                        {hospital.capabilities?.length ?? 0}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Listed specialties</p>
                    </div>
                  </div>

                  {badgesToDisplay.length > 0 && (
                    <div className="mt-4">
                      <div className="flex flex-wrap gap-2">
                        {badgesToDisplay.map((badge) => (
                          <span
                            key={badge.id}
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${badge.color.pill}`}
                            title={badge.description ?? undefined}
                          >
                            {badge.name}
                            {badge.level ? ` • ${badge.level}` : ''}
                          </span>
                        ))}
                        {moreCapabilities > 0 && (
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                            +{moreCapabilities} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-5 flex flex-wrap gap-3">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      disabled={!hospital.squadPhone}
                      onClick={() => hospital.squadPhone && window.open(`tel:${hospital.squadPhone}`, '_self')}
                      className="inline-flex flex-1 items-center justify-center rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-black disabled:cursor-not-allowed disabled:bg-slate-400 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 lg:flex-none lg:px-5"
                    >
                      Call Squad
                    </motion.button>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      disabled={!navigationUrl}
                      onClick={() => navigationUrl && window.open(navigationUrl, '_blank', 'noopener')}
                      className="inline-flex flex-1 items-center justify-center rounded-2xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:bg-slate-400 lg:flex-none lg:px-5"
                    >
                      Navigate
                    </motion.button>
                    <Link
                      href={`/hospitals/${hospital.id}`}
                      className="inline-flex flex-1 items-center justify-center rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-500 lg:flex-none lg:px-5"
                    >
                      View details
                    </Link>
                  </div>
                </motion.article>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
