'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import type { Base } from '@/payload-types'
import { calculateDistanceMiles, estimateEtaMinutes, fetchRealTimeEta, getTrafficColor, type TrafficStatus } from '@/utilities/distance'
import { getDeviceLocation } from '@/utilities/geolocation'

interface BasesClientProps {
  bases: Base[]
}

interface BaseWithDistance extends Base {
  distance?: number
  eta?: number
  trafficStatus?: TrafficStatus
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
  }, [])

  const [realtimeEtas, setRealtimeEtas] = useState<Map<number, { eta: number; distance: number; trafficStatus?: TrafficStatus }>>(new Map())

  const basesWithDistance = useMemo<BaseWithDistance[]>(() => {
    return bases.map((base) => {
      // Use realtime ETA if available
      const realtimeData = realtimeEtas.get(base.id)
      if (realtimeData) {
        return {
          ...base,
          distance: realtimeData.distance,
          eta: realtimeData.eta,
          trafficStatus: realtimeData.trafficStatus,
        }
      }

      // Fallback to basic calculation
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
  }, [bases, userLocation, realtimeEtas])

  // Fetch realtime ETAs when user location is available
  useEffect(() => {
    if (!userLocation) return

    const fetchRealtimeEtas = async () => {
      const etaPromises = bases
        .filter((base) =>
          typeof base.latitude === 'number' &&
          typeof base.longitude === 'number'
        )
        .map(async (base) => {
          const etaData = await fetchRealTimeEta(
            base.latitude as number,
            base.longitude as number,
            userLocation.lat,
            userLocation.lon,
          )

          if (etaData) {
            return {
              id: base.id,
              eta: etaData.etaMinutes,
              distance: etaData.distanceMiles,
              trafficStatus: etaData.trafficStatus,
            }
          }
          return null
        })

      const results = await Promise.all(etaPromises)
      const newEtas = new Map<number, { eta: number; distance: number; trafficStatus?: TrafficStatus }>()

      results.forEach((result) => {
        if (result) {
          newEtas.set(result.id, { eta: result.eta, distance: result.distance, trafficStatus: result.trafficStatus })
        }
      })

      setRealtimeEtas(newEtas)
    }

    fetchRealtimeEtas()
  }, [userLocation, bases])

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
                            <p className={`text-sm font-semibold ${
                              base.trafficStatus
                                ? getTrafficColor(base.trafficStatus)
                                : 'text-uc-text-light-default dark:text-uc-text-dark-default'
                            }`}>
                              {typeof base.eta === 'number' ? `~${base.eta}` : 'ETA pending'}
                            </p>
                          </div>
                          <div className="flex flex-col rounded-lg bg-uc-light-subtle/70 px-3 py-2 text-left sm:text-right dark:bg-neutral-700/60">
                            <p className="text-[11px] uppercase tracking-wide text-uc-text-light-subtle dark:text-uc-text-dark-subtle">
                              Miles
                            </p>
                            <p className="text-sm font-semibold text-uc-text-light-default dark:text-uc-text-dark-default">
                              {typeof base.distance === 'number' ? base.distance.toFixed(1) : '—'}
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
