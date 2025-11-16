'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import type { Hospital, HospitalNetwork, HospitalCapability, Media } from '@/payload-types'
import { calculateDistanceMiles, estimateEtaMinutes } from '@/utilities/distance'
import { capabilityColors } from './capabilityColors'

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

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (!isMobile) return

    if (!('geolocation' in navigator)) {
      setLocationError('Location not supported on this device')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({ lat: position.coords.latitude, lon: position.coords.longitude })
        setLocationError(null)
      },
      (error) => {
        console.error('Geolocation error:', error)
        setLocationError(error.message || 'Location access denied')
      },
    )
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
    <div className="min-h-screen bg-uc-light-bg text-uc-text-light-default dark:bg-uc-dark-bg dark:text-uc-text-dark-default">
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
                className="h-8 rounded-full border border-uc-light-border bg-uc-light-card pl-3 pr-8 text-xs font-medium text-uc-text-light-muted shadow-sm focus:border-uc-red-300 focus:outline-none focus:ring-2 focus:ring-uc-red-200 dark:border-uc-dark-border dark:bg-uc-dark-card dark:text-uc-text-dark-muted"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[10px] text-uc-text-light-subtle dark:text-uc-text-dark-subtle">
                ▼
              </span>
            </div>
          </div>
        </div>

        <div className="mb-4 rounded-2xl bg-uc-light-card p-3 shadow-uc-card-light ring-1 ring-uc-light-border dark:bg-uc-dark-card dark:ring-uc-dark-border dark:shadow-uc-card-dark">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-uc-text-light-muted dark:text-uc-text-dark-muted">
              <span className="text-base">🧪</span>
              <span>Filter by capability</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <select
                  value={capabilityFilter ?? ''}
                  onChange={(event) =>
                    setCapabilityFilter(event.target.value === '' ? null : Number(event.target.value))
                  }
                  className="h-9 min-w-[10rem] rounded-full border border-uc-light-border bg-uc-light-subtle pl-3 pr-8 text-xs font-medium text-uc-text-light-muted shadow-sm focus:border-uc-red-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-uc-red-200 dark:border-uc-dark-border dark:bg-uc-dark-subtle dark:text-uc-text-dark-muted dark:focus:bg-uc-dark-card"
                >
                  <option value="">All capabilities</option>
                  {capabilities.map((capability) => (
                    <option key={capability.id} value={capability.id}>
                      {capability.name}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[10px] text-uc-text-light-subtle dark:text-uc-text-dark-subtle">
                  ▼
                </span>
              </div>
              {capabilityFilter && (
                <button
                  type="button"
                  onClick={() => setCapabilityFilter(null)}
                  className="rounded-full border border-uc-light-border bg-white px-2 py-1 text-xs font-medium text-uc-text-light-muted transition hover:bg-uc-light-subtle dark:border-uc-dark-border dark:bg-uc-dark-card dark:text-uc-text-dark-muted"
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
          <div className="rounded-2xl border-2 border-dashed border-uc-light-border bg-uc-light-subtle p-8 text-center text-sm text-uc-text-light-muted dark:border-uc-dark-border dark:bg-uc-dark-subtle dark:text-uc-text-dark-muted">
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
                <Link key={cardKey} href={`/hospitals/${hospital.id ?? ''}`} className="block">
                  <motion.article
                    whileHover={{ y: -2, scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="rounded-2xl bg-uc-light-card p-4 text-left shadow-uc-card-light ring-1 ring-uc-light-border transition dark:bg-uc-dark-card dark:shadow-uc-card-dark dark:ring-uc-dark-border"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        {networkLogo?.url ? (
                          <img
                            src={networkLogo.url}
                            alt={networkLogo.alt || `${network?.name ?? hospital.name} logo`}
                            className="h-10 w-10 rounded-full bg-white p-0.5 ring-1 ring-uc-light-border object-cover dark:bg-uc-dark-card dark:ring-uc-dark-border"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white ring-1 ring-uc-light-border dark:bg-uc-dark-card dark:ring-uc-dark-border">
                            <span className="text-sm font-semibold text-uc-text-light-default dark:text-uc-text-dark-default">
                              {hospital.name?.[0]?.toUpperCase() ?? '🏥'}
                            </span>
                          </div>
                        )}
                        <div className="flex flex-col">
                          <div className="mb-1 flex items-center gap-2">
                            <h2 className="text-base font-semibold">{hospital.name}</h2>
                            {network?.name && (
                              <span className="rounded-full bg-uc-light-subtle px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-uc-text-light-muted dark:bg-uc-dark-subtle dark:text-uc-text-dark-muted">
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
                      <div className="flex items-center gap-3 text-right text-xs text-uc-text-light-muted dark:text-uc-text-dark-muted">
                        <div>
                          <p className="text-[11px] uppercase tracking-wide text-uc-text-light-subtle dark:text-uc-text-dark-subtle">
                            Distance
                          </p>
                          <p className="text-sm font-semibold text-uc-text-light-default dark:text-uc-text-dark-default">
                            {typeof hospital.distance === 'number'
                              ? `${hospital.distance.toFixed(1)} mi`
                              : '—'}
                          </p>
                          <p className="text-[11px]">
                            {typeof hospital.eta === 'number' ? `~${hospital.eta} min` : 'ETA pending'}
                          </p>
                        </div>
                        <motion.span
                          initial={{ x: 0 }}
                          whileHover={{ x: 4 }}
                          className="flex items-center text-base text-uc-text-light-subtle dark:text-uc-text-dark-subtle"
                        >
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
                        </motion.span>
                      </div>
                    </div>

                    <div className="my-3 h-px bg-uc-light-border dark:bg-uc-dark-border" />

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <div className="flex items-center gap-1 text-uc-text-light-muted dark:text-uc-text-dark-muted">
                        <span className="text-[13px]">🏥</span>
                        <span className="font-medium">Capabilities:</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {badgesToDisplay.map((badge) => (
                          <span
                            key={badge.id}
                            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${badge.color.pill}`}
                            title={badge.description ?? undefined}
                          >
                            {badge.name}
                            {badge.level ? ` • ${badge.level}` : ''}
                          </span>
                        ))}
                        {moreCount > 0 && (
                          <span className="rounded-full bg-uc-light-subtle px-2 py-0.5 text-[11px] font-medium text-uc-text-light-muted ring-1 ring-uc-light-border dark:bg-uc-dark-subtle dark:text-uc-text-dark-muted dark:ring-uc-dark-border">
                            +{moreCount} more
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.article>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
