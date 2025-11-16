'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import type { Base } from '@/payload-types'
import { calculateDistanceMiles, estimateEtaMinutes } from '@/utilities/distance'

interface BasesClientProps {
  bases: Base[]
}

interface BaseWithDistance extends Base {
  distance?: number
  eta?: number
}

const buildAddressSummary = (base: Base) => {
  const city = base.address?.city?.trim()
  const state = base.address?.state?.trim()
  if (city || state) {
    return [city, state].filter(Boolean).join(', ')
  }
  return base.address?.line1?.trim() ?? null
}

export function BasesClient({ bases }: BasesClientProps) {
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

  const basesWithDistance = useMemo<BaseWithDistance[]>(() => {
    return bases.map((base) => {
      if (
        userLocation &&
        typeof base.latitude === 'number' &&
        typeof base.longitude === 'number'
      ) {
        const distance = calculateDistanceMiles(
          userLocation.lat,
          userLocation.lon,
          base.latitude,
          base.longitude,
        )
        return {
          ...base,
          distance,
          eta: estimateEtaMinutes(distance),
        }
      }
      return base
    })
  }, [bases, userLocation])

  const sortedBases = useMemo(() => {
    return [...basesWithDistance].sort((a, b) => {
      const aDistance = typeof a.distance === 'number' ? a.distance : Infinity
      const bDistance = typeof b.distance === 'number' ? b.distance : Infinity
      return aDistance - bDistance
    })
  }, [basesWithDistance])

  return (
    <div className="min-h-screen bg-uc-light-bg text-uc-text-light-default dark:bg-neutral-900 dark:text-uc-text-dark-default">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Base Directory</h1>
            <p className="text-sm text-uc-text-light-muted dark:text-uc-text-dark-muted">
              Quick view of base locations and distance from you
            </p>
          </div>
        </div>

        <div className="mb-3 text-xs text-uc-text-light-muted dark:text-uc-text-dark-muted">
          {sortedBases.length} base{sortedBases.length === 1 ? '' : 's'} found
        </div>
        {locationError && (
          <p className="mb-4 text-xs text-amber-600">{locationError}</p>
        )}

        {sortedBases.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-uc-light-border bg-uc-light-subtle p-8 text-center text-sm text-uc-text-light-muted dark:border-neutral-700 dark:bg-neutral-800 dark:text-uc-text-dark-muted">
            No bases found yet.
          </div>
        ) : (
          <div className="space-y-3">
            {sortedBases.map((base) => {
              const addressSummary = buildAddressSummary(base)
              const cardKey = `${base.id}`

              return (
                <Link key={cardKey} href={`/bases/${base.slug ?? base.id ?? ''}`} className="block">
                  <article
                    className="rounded-2xl bg-uc-light-card p-4 text-left ring-1 ring-uc-light-border transition dark:bg-neutral-800 dark:ring-neutral-700"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="text-base font-semibold">{base.name}</h2>
                        <div className="mt-1 flex items-center gap-1 text-xs text-uc-text-light-muted dark:text-uc-text-dark-muted">
                          <span aria-hidden="true">📍</span>
                          <span>{addressSummary ?? 'Location pending'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-right text-xs text-uc-text-light-muted dark:text-uc-text-dark-muted">
                        <div>
                          <p className="text-[11px] uppercase tracking-wide text-uc-text-light-subtle dark:text-uc-text-dark-subtle">
                            Distance
                          </p>
                          <p className="text-sm font-semibold text-uc-text-light-default dark:text-uc-text-dark-default">
                            {typeof base.distance === 'number'
                              ? `${base.distance.toFixed(1)} mi`
                              : '—'}
                          </p>
                          <p className="text-[11px]">
                            {typeof base.eta === 'number' ? `~${base.eta} min` : 'ETA pending'}
                          </p>
                        </div>
                        <span className="flex items-center text-base text-uc-text-light-subtle dark:text-uc-text-dark-subtle">
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
                  </article>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
