'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import type { Hospital, HospitalNetwork, HospitalCapability, Media } from '@/payload-types'
import { calculateDistanceMiles, estimateEtaMinutes } from '@/utilities/distance'
import { getDeviceLocation } from '@/utilities/geolocation'
import { capabilityColors, type CapabilityColorToken } from './capabilityColors'

type SortOption = 'distanceAsc' | 'distanceDesc' | 'alpha'

interface HospitalsClientProps {
  hospitals: Hospital[]
  capabilities: HospitalCapability[]
}

interface HospitalWithDistance extends Hospital {
  distance?: number
  eta?: number
}

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'distanceAsc', label: 'Closest first' },
  { value: 'distanceDesc', label: 'Farthest first' },
  { value: 'alpha', label: 'A–Z' },
]

const buildAddressSummary = (hospital: Hospital) => {
  const city = hospital.address?.city?.trim()
  const state = hospital.address?.state?.trim()
  if (city || state) {
    return [city, state].filter(Boolean).join(', ')
  }
  return hospital.address?.line1?.trim() ?? null
}

const resolveNetwork = (hospital: Hospital): HospitalNetwork | null => {
  return typeof hospital.network === 'object' && hospital.network !== null
    ? (hospital.network as HospitalNetwork)
    : null
}

const resolveNetworkLogo = (hospital: Hospital): Media | null => {
  const override = hospital.networkLogoOverride
  if (override && typeof override === 'object') {
    return override as Media
  }
  const network = resolveNetwork(hospital)
  if (network?.logo && typeof network.logo === 'object') {
    return network.logo as Media
  }
  return null
}

const getCapabilityBadges = (hospital: Hospital) => {
  if (!hospital.capabilities) return []

  return hospital.capabilities
    .map((cap, idx) => {
      const capability = typeof cap.capability === 'object' ? (cap.capability as HospitalCapability) : null
      if (!capability) return null
      const level = cap.level?.trim()
      const category = capability.category ?? 'other'
      const color = capabilityColors[category] ?? capabilityColors.other
      const normalizedLevel = level?.toLowerCase()
      const levelMeta = normalizedLevel
        ? capability.levels?.find((option) => option.level?.toLowerCase() === normalizedLevel)
        : null

      return {
        id: `${hospital.id}-${idx}`,
        name: capability.name,
        level,
        description: levelMeta?.description ?? null,
        color,
      }
    })
    .filter((badge): badge is NonNullable<typeof badge> => Boolean(badge))
}

export function HospitalsClient({ hospitals, capabilities }: HospitalsClientProps) {
  const [capabilityFilter, setCapabilityFilter] = useState<number | null>(null)
  const [sortOption, setSortOption] = useState<SortOption>('distanceAsc')
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [selectedCapability, setSelectedCapability] = useState<{ name: string; level: string | null; description: string | null; color: CapabilityColorToken } | null>(null)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (!isMobile) return

    const fetchLocation = async () => {
      const location = await getDeviceLocation()
      if (location) {
        setUserLocation(location)
        setLocationError(null)
      } else {
        setLocationError('Location access denied')
      }
    }

    fetchLocation()
  }, [isMobile])

  const capabilityNameById = useMemo(() => {
    const map = new Map<number, string>()
    capabilities.forEach((capability) => {
      map.set(capability.id, capability.name)
    })
    return map
  }, [capabilities])

  const hospitalsWithDistance = useMemo<HospitalWithDistance[]>(() => {
    return hospitals.map((hospital) => {
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
        return {
          ...hospital,
          distance,
          eta: estimateEtaMinutes(distance),
        }
      }
      return hospital
    })
  }, [hospitals, userLocation])

  const filteredAndSorted = useMemo(() => {
    let list = hospitalsWithDistance
    if (capabilityFilter) {
      list = list.filter((hospital) =>
        hospital.capabilities?.some((cap) => {
          const capability = typeof cap.capability === 'object' ? (cap.capability as HospitalCapability) : null
          return capability?.id === capabilityFilter
        }),
      )
    }

    const sorted = [...list].sort((a, b) => {
      switch (sortOption) {
        case 'alpha':
          return (a.name ?? '').localeCompare(b.name ?? '')
        case 'distanceDesc': {
          const aDistance = typeof a.distance === 'number' ? a.distance : -Infinity
          const bDistance = typeof b.distance === 'number' ? b.distance : -Infinity
          return bDistance - aDistance
        }
        case 'distanceAsc':
        default: {
          const aDistance = typeof a.distance === 'number' ? a.distance : Infinity
          const bDistance = typeof b.distance === 'number' ? b.distance : Infinity
          return aDistance - bDistance
        }
      }
    })

    return sorted
  }, [capabilityFilter, hospitalsWithDistance, sortOption])

  const capabilityFilterLabel = capabilityFilter ? capabilityNameById.get(capabilityFilter) : null

  return (
    <div className="min-h-screen bg-uc-light-bg text-uc-text-light-default dark:bg-neutral-900 dark:text-uc-text-dark-default">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Hospital Directory</h1>
            <p className="text-sm text-uc-text-light-muted dark:text-uc-text-dark-muted">
              Hospital information, contacts, and capabilities
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <span className="text-uc-text-light-muted dark:text-uc-text-dark-muted">Sort by</span>
            <div className="relative">
              <select
                value={sortOption}
                onChange={(event) => setSortOption(event.target.value as SortOption)}
                  className="h-9 appearance-none rounded-lg border border-uc-light-border bg-uc-light-card pl-3 pr-8 text-xs font-medium text-uc-text-light-default cursor-pointer transition hover:border-neutral-400 focus:border-uc-red-500 focus:outline-none focus:ring-2 focus:ring-uc-red-200 dark:border-neutral-700 dark:bg-neutral-800 dark:text-uc-text-dark-default dark:hover:border-neutral-600 dark:focus:border-uc-red-400 dark:focus:ring-uc-red-900/30"
                  style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3E%3C/svg%3E")', backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="mb-4 rounded-2xl bg-uc-light-card p-3 ring-1 ring-uc-light-border dark:bg-neutral-800 dark:ring-neutral-700">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-uc-text-light-muted dark:text-uc-text-dark-muted">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <span>Filter by capability</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <select
                  value={capabilityFilter ?? ''}
                  onChange={(event) =>
                    setCapabilityFilter(event.target.value === '' ? null : Number(event.target.value))
                  }
                  className="h-9 min-w-[10rem] appearance-none rounded-lg border border-uc-light-border bg-uc-light-card pl-3 pr-8 text-xs font-medium text-uc-text-light-default cursor-pointer transition hover:border-neutral-400 focus:border-uc-red-500 focus:outline-none focus:ring-2 focus:ring-uc-red-200 dark:border-neutral-700 dark:bg-neutral-800 dark:text-uc-text-dark-default dark:hover:border-neutral-600 dark:focus:border-uc-red-400 dark:focus:ring-uc-red-900/30"
                  style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3E%3C/svg%3E")', backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
                >
                  <option value="">All capabilities</option>
                  {capabilities.map((capability) => (
                    <option key={capability.id} value={capability.id}>
                      {capability.name}
                    </option>
                  ))}
                </select>
              </div>
              {capabilityFilter && (
                <button
                  type="button"
                  onClick={() => setCapabilityFilter(null)}
                  className="rounded-full border border-uc-light-border bg-white px-2 py-1 text-xs font-medium text-uc-text-light-muted transition hover:bg-uc-light-subtle dark:border-neutral-700 dark:bg-neutral-800 dark:text-uc-text-dark-muted"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mb-3 text-xs text-uc-text-light-muted dark:text-uc-text-dark-muted">
          {filteredAndSorted.length} hospital{filteredAndSorted.length === 1 ? '' : 's'} found
          {capabilityFilterLabel && (
            <>
              {' '}
              • filtered by <span className="font-semibold">{capabilityFilterLabel}</span>
            </>
          )}
        </div>
        {locationError && (
          <p className="mb-4 text-xs text-amber-600">{locationError}</p>
        )}

        {filteredAndSorted.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-uc-light-border bg-uc-light-subtle p-8 text-center text-sm text-uc-text-light-muted dark:border-neutral-700 dark:bg-neutral-800 dark:text-uc-text-dark-muted">
            No hospitals match this capability filter yet.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAndSorted.map((hospital) => {
              const network = resolveNetwork(hospital)
              const networkLogo = resolveNetworkLogo(hospital)
              const addressSummary = buildAddressSummary(hospital)
              const capabilityBadges = getCapabilityBadges(hospital)
              const badgesToDisplay = capabilityBadges.slice(0, 3)
              const moreCount = Math.max(capabilityBadges.length - badgesToDisplay.length, 0)
              const cardKey = `${hospital.id}`

              return (
                <Link key={cardKey} href={`/hospitals/${hospital.slug ?? hospital.id ?? ''}`} className="block">
                  <article
                    className="rounded-2xl bg-uc-light-card p-4 text-left ring-1 ring-uc-light-border transition dark:bg-neutral-800 dark:ring-neutral-700"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        {networkLogo?.url ? (
                          <Image
                            src={networkLogo.url}
                            alt={networkLogo.alt || `${network?.name ?? hospital.name} logo`}
                            width={40}
                            height={40}
                            className="h-10 w-10 rounded-full bg-white p-0.5 ring-1 ring-uc-light-border object-cover dark:bg-neutral-800 dark:ring-neutral-700"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white ring-1 ring-uc-light-border dark:bg-neutral-800 dark:ring-neutral-700">
                            <span className="text-sm font-semibold text-uc-text-light-default dark:text-uc-text-dark-default">
                              {hospital.name?.[0]?.toUpperCase() ?? '🏥'}
                            </span>
                          </div>
                        )}
                        <div className="flex flex-col">
                          <div className="mb-1 flex items-center gap-2">
                            <h2 className="text-base font-semibold">{hospital.name}</h2>
                            {network?.name && (
                              <span className="rounded-full bg-uc-light-subtle px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-uc-text-light-muted dark:bg-neutral-700 dark:text-uc-text-dark-muted">
                                {network.name}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-uc-text-light-muted dark:text-uc-text-dark-muted">
                            <span aria-hidden="true">📍</span>
                            <span>{addressSummary ?? 'Location pending'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex w-full flex-col gap-2 text-xs text-uc-text-light-muted dark:text-uc-text-dark-muted sm:w-auto sm:flex-row sm:items-center sm:gap-3">
                        <div className="grid w-full grid-cols-3 gap-2 sm:w-auto">
                          <div className="flex flex-col rounded-lg bg-uc-light-subtle/70 px-3 py-2 text-left sm:text-right dark:bg-neutral-700/60">
                            <p className="text-[11px] uppercase tracking-wide text-uc-text-light-subtle dark:text-uc-text-dark-subtle">
                              Distance
                            </p>
                            <p className="text-sm font-semibold text-uc-text-light-default dark:text-uc-text-dark-default">
                              From you
                            </p>
                          </div>
                          <div className="flex flex-col rounded-lg bg-uc-light-subtle/70 px-3 py-2 text-left sm:text-right dark:bg-neutral-700/60">
                            <p className="text-[11px] uppercase tracking-wide text-uc-text-light-subtle dark:text-uc-text-dark-subtle">
                              Mins
                            </p>
                            <p className="text-sm font-semibold text-uc-text-light-default dark:text-uc-text-dark-default">
                              {typeof hospital.eta === 'number' ? `~${hospital.eta}` : 'ETA pending'}
                            </p>
                          </div>
                          <div className="flex flex-col rounded-lg bg-uc-light-subtle/70 px-3 py-2 text-left sm:text-right dark:bg-neutral-700/60">
                            <p className="text-[11px] uppercase tracking-wide text-uc-text-light-subtle dark:text-uc-text-dark-subtle">
                              Miles
                            </p>
                            <p className="text-sm font-semibold text-uc-text-light-default dark:text-uc-text-dark-default">
                              {typeof hospital.distance === 'number' ? hospital.distance.toFixed(1) : '—'}
                            </p>
                          </div>
                        </div>
                        <span className="flex items-center justify-end text-base text-uc-text-light-subtle dark:text-uc-text-dark-subtle sm:justify-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="h-4 w-4"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </span>
                      </div>
                    </div>

                    <div className="my-3 h-px bg-uc-light-border dark:bg-neutral-700" />

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <div className="flex items-center gap-1 text-uc-text-light-muted dark:text-uc-text-dark-muted">
                        <span className="text-[13px]">🏥</span>
                        <span className="font-medium">Capabilities:</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {badgesToDisplay.map((badge) => (
                          <button
                            key={badge.id}
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              if (badge.description) {
                                setSelectedCapability(badge)
                              }
                            }}
                            className={`group relative inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 transition hover:opacity-80 ${badge.color.pill}`}
                          >
                            <span className={badge.color.text}>
                              {badge.name}
                              {badge.level ? ` • ${badge.level}` : ''}
                            </span>
                          </button>
                        ))}
                        {moreCount > 0 && (
                          <span className="rounded-full bg-uc-light-subtle px-2 py-0.5 text-[11px] font-medium text-uc-text-light-muted ring-1 ring-uc-light-border dark:bg-neutral-700 dark:text-uc-text-dark-muted dark:ring-neutral-600">
                            +{moreCount} more
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedCapability && (
          <motion.div
            className="fixed inset-0 z-30 flex items-center justify-center bg-neutral-900/60 p-4 dark:bg-neutral-950/80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedCapability(null)}
          >
            <motion.div
              className="w-full max-w-sm rounded-2xl bg-uc-light-card p-5 ring-1 ring-uc-light-border dark:bg-neutral-800 dark:ring-neutral-700"
              initial={{ scale: 0.95, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 10, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-uc-text-light-default dark:text-uc-text-dark-default">
                  Clinical Capability
                </h3>
                <button
                  onClick={() => setSelectedCapability(null)}
                  className="rounded-full p-1 text-uc-text-light-subtle hover:bg-uc-light-subtle hover:text-uc-text-light-default dark:text-uc-text-dark-subtle dark:hover:bg-neutral-700 dark:hover:text-uc-text-dark-default"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <div className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ring-1 ${selectedCapability.color.pill}`}>
                    <span className={selectedCapability.color.text}>
                      {selectedCapability.name}
                      {selectedCapability.level ? ` • ${selectedCapability.level}` : ''}
                    </span>
                  </div>
                </div>
                {selectedCapability.description && (
                  <div className="rounded-lg bg-uc-light-subtle p-3 dark:bg-neutral-700/50">
                    <p className="text-sm text-uc-text-light-default dark:text-uc-text-dark-default">
                      {selectedCapability.description}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
