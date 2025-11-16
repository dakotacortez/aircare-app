'use client'

import { useCallback, useMemo, useState } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import type { Hospital, HospitalNetwork, HospitalCapability, Media } from '@/payload-types'
import { DoorCodeList } from '@/components/door-code-list'
import { calculateDistanceMiles, estimateEtaMinutes } from '@/utilities/distance'
import { capabilityColors } from '../capabilityColors'

interface HospitalDetailCardProps {
  hospital: Hospital
  network?: HospitalNetwork | null
  networkLogo?: Media | null
}

type CapabilityBadge = {
  id: string
  name: string
  level?: string | null
  description?: string | null
  color: {
    pill: string
    text: string
    tooltip: string
  }
}

const fallbackMapTabs = [
  {
    id: 'ambulance',
    label: 'Ambulance route',
    mapType: 'ambulance',
    description: 'Ambulance road map / approach routes thumbnail',
  },
  {
    id: 'interior',
    label: 'Interior layout',
    mapType: 'interior',
    description: 'Interior layout map (ED, imaging, ICU, elevators)',
  },
  {
    id: 'parking',
    label: 'Parking & bays',
    mapType: 'parking',
    description: 'Parking, ambulance bays, and staging areas',
  },
]

const mapTypeEmoji: Record<string, string> = {
  ambulance: '🧭',
  interior: '🏥',
  parking: '🅿️',
  lz: '🚁',
  custom: '🗺️',
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

function formatPhone(phone: string) {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  if (digits.length === 7) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`
  }
  return phone
}

export function HospitalDetailCard({ hospital, network, networkLogo }: HospitalDetailCardProps) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle')
  const [showNavModal, setShowNavModal] = useState(false)
  const [etaState, setEtaState] = useState<{
    status: 'idle' | 'loading' | 'ready' | 'error'
    etaMinutes?: number
    distanceMiles?: number
    errorMessage?: string
  }>({ status: 'idle' })

  const addressLines = useMemo(() => {
    const line1 = hospital.address?.line1?.trim()
    const line2 = hospital.address?.line2?.trim()
    const city = hospital.address?.city?.trim()
    const state = hospital.address?.state?.trim()
    const zip = hospital.address?.zip?.trim()
    const cityLine = [city, state].filter(Boolean).join(', ')
    const lines = [line1, line2, [cityLine, zip].filter(Boolean).join(' ').trim()].filter(Boolean)
    return lines as string[]
  }, [hospital.address])

  const navigationQuery = useMemo(() => {
    if (typeof hospital.latitude === 'number' && typeof hospital.longitude === 'number') {
      return {
        type: 'coords' as const,
        value: `${hospital.latitude},${hospital.longitude}`,
      }
    }
    const query = addressLines.join(', ')
    return query
      ? {
          type: 'address' as const,
          value: query,
        }
      : null
  }, [addressLines, hospital.latitude, hospital.longitude])

  const doorCodes = useMemo(() => hospital.doorCodes ?? [], [hospital.doorCodes])

  const capabilityBadges = useMemo<CapabilityBadge[]>(() => {
    if (!hospital.capabilities) return []
    return hospital.capabilities
      .map((cap, idx) => {
        const capability = typeof cap.capability === 'object' ? (cap.capability as HospitalCapability) : null
        if (!capability) return null
        const level = cap.level ?? undefined
        const normalizedLevel = level?.toLowerCase().trim()
        const levelMeta =
          normalizedLevel && capability.levels
            ? capability.levels.find((option) => option.level?.toLowerCase().trim() === normalizedLevel)
            : null
        const category = capability.category ?? 'other'
        const color = capabilityColors[category] ?? capabilityColors.other
          return {
          id: `${capability.id ?? idx}`,
          name: capability.name,
          level,
            description: levelMeta?.description ?? null,
          color,
        }
      })
      .filter(Boolean) as CapabilityBadge[]
  }, [hospital.capabilities])

  const primaryDoorCode = useMemo(() => {
    const prioritized = doorCodes.find((code) => code?.isPrimary)
    return (prioritized ?? doorCodes[0]) ?? null
  }, [doorCodes])

  const otherContacts = (hospital.otherPhones ?? []).filter(
    (contact) => contact?.phoneNumber?.trim() && contact?.label?.trim(),
  )

  const hazards = (hospital.hazards ?? []).filter((item) => item?.note?.trim())

  const campusTabs = useMemo(() => {
    const tabs = (hospital.campusMaps ?? [])
      .map((tab, idx) => {
        const label = tab?.label?.trim()
        if (!label) return null
        const mapType = tab?.mapType ?? 'custom'
        const id = tab?.slug?.trim() || `${mapType}-${slugify(label)}-${idx}`
        const media = typeof tab?.mapMedia === 'object' ? (tab.mapMedia as Media) : null
        return {
          id,
          label,
          mapType,
          description: tab?.description?.trim(),
          media,
          externalUrl: tab?.externalUrl?.trim(),
        }
      })
      .filter((tab): tab is NonNullable<typeof tab> => tab !== null)

    if (!tabs.length) {
      return fallbackMapTabs
    }
    return tabs
  }, [hospital.campusMaps])

  const [activeMapTab, setActiveMapTab] = useState(campusTabs[0]?.id ?? 'ambulance')

  const handleCopyAllInfo = useCallback(() => {
    const infoLines = [
      hospital.name,
      network?.name ? `Network: ${network.name}` : null,
      addressLines.length ? `Address: ${addressLines.join(', ')}` : null,
      primaryDoorCode?.code ? `ED Door Code: ${primaryDoorCode.code}` : null,
      hospital.squadPhone ? `Squad Phone: ${hospital.squadPhone}` : null,
      capabilityBadges.length
        ? `Capabilities: ${capabilityBadges.map((badge) => `${badge.name}${badge.level ? ` (${badge.level})` : ''}`).join('; ')}`
        : null,
    ].filter(Boolean)

    const info = infoLines.join('\n')

    const handleSuccess = () => {
      setCopyState('copied')
      setTimeout(() => setCopyState('idle'), 2500)
    }
    const handleError = () => {
      setCopyState('error')
      setTimeout(() => setCopyState('idle'), 2500)
    }

    if (navigator.share && info) {
      navigator
        .share({
          title: hospital.name,
          text: info,
        })
        .then(handleSuccess)
        .catch(() => {
          if (navigator.clipboard?.writeText) {
            navigator.clipboard
              .writeText(info)
              .then(handleSuccess)
              .catch(handleError)
          } else {
            handleError()
          }
        })
      return
    }

    if (navigator.clipboard?.writeText && info) {
      navigator.clipboard.writeText(info).then(handleSuccess).catch(handleError)
      return
    }

    handleError()
  }, [addressLines, capabilityBadges, hospital.name, hospital.squadPhone, network?.name, primaryDoorCode?.code])

  const requestEta = useCallback(() => {
    if (!navigator.geolocation) {
      setEtaState({
        status: 'error',
        errorMessage: 'Location not supported on this device.',
      })
      return
    }
    if (typeof hospital.latitude !== 'number' || typeof hospital.longitude !== 'number') {
      setEtaState({
        status: 'error',
        errorMessage: 'Hospital is missing GPS coordinates.',
      })
      return
    }
    setEtaState({ status: 'loading' })
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const distance = calculateDistanceMiles(
          position.coords.latitude,
          position.coords.longitude,
          hospital.latitude as number,
          hospital.longitude as number,
        )
        const eta = estimateEtaMinutes(distance)
        setEtaState({
          status: 'ready',
          etaMinutes: eta,
          distanceMiles: Number.isFinite(distance) ? distance : undefined,
        })
      },
      (error) => {
        console.error('Geolocation error', error)
        setEtaState({
          status: 'error',
          errorMessage: error.message || 'Unable to access location.',
        })
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      },
    )
  }, [hospital.latitude, hospital.longitude])

  const handleOpenNavigation = useCallback((provider: 'google' | 'apple' | 'waze') => {
    if (!navigationQuery) {
      return
    }
    let url = ''
    const value = navigationQuery.value
    if (provider === 'google') {
      url =
        navigationQuery.type === 'coords'
          ? `https://www.google.com/maps/dir/?api=1&destination=${value}`
          : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(value)}`
    } else if (provider === 'apple') {
      url =
        navigationQuery.type === 'coords'
          ? `http://maps.apple.com/?daddr=${value}`
          : `http://maps.apple.com/?daddr=${encodeURIComponent(value)}`
    } else {
      url =
        navigationQuery.type === 'coords'
          ? `https://www.waze.com/ul?ll=${value}&navigate=yes`
          : `https://www.waze.com/ul?query=${encodeURIComponent(value)}`
    }
    window.open(url, '_blank', 'noopener')
  }, [navigationQuery])

  const sourceAttribution =
    hospital.sourceAttribution?.trim() ?? 'Source: Air Care & Mobile Care education team'
  const lastUpdated = hospital.updatedAt ? new Date(hospital.updatedAt) : null

  return (
    <div className="rounded-3xl bg-uc-light-card text-uc-text-light-default shadow-uc-card-light ring-1 ring-uc-light-border dark:bg-neutral-800 dark:text-uc-text-dark-default dark:shadow-uc-card-dark dark:ring-neutral-700">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {networkLogo?.url ? (
              <Image
                src={networkLogo.url}
                alt={networkLogo.alt || `${network?.name ?? hospital.name} logo`}
                width={48}
                height={48}
                className="h-12 w-12 rounded-full bg-white p-0.5 ring-1 ring-uc-light-border object-cover dark:bg-neutral-800 dark:ring-neutral-700"
              />
            ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white ring-1 ring-uc-light-border dark:bg-neutral-800 dark:ring-neutral-700">
                  <span className="text-lg font-semibold text-uc-text-light-default dark:text-uc-text-dark-default">
                  {hospital.name?.[0]?.toUpperCase() ?? '🏥'}
                </span>
              </div>
            )}
            <div className="flex flex-col leading-tight">
              <h1 className="text-2xl font-bold">{hospital.name}</h1>
                {network?.name && (
                  <span className="text-xs font-medium text-uc-text-light-muted dark:text-uc-text-dark-muted">
                    {network.name}
                  </span>
                )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopyAllInfo}
              className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-uc-text-light-muted ring-1 ring-uc-light-border shadow-sm transition hover:bg-uc-light-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-uc-red-200 dark:bg-neutral-700/80 dark:text-uc-text-dark-muted dark:ring-neutral-600"
            >
              <span role="img" aria-hidden="true">
                📋
              </span>
              <span>{copyState === 'copied' ? 'Copied' : copyState === 'error' ? 'Try again' : 'Share info'}</span>
            </button>
            <a
              href={`mailto:?subject=Hospital info update: ${encodeURIComponent(hospital.name ?? '')}`}
              className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-uc-text-light-muted ring-1 ring-uc-light-border shadow-sm transition hover:bg-uc-light-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-uc-red-200 dark:bg-neutral-700/80 dark:text-uc-text-dark-muted dark:ring-neutral-600"
            >
              <span role="img" aria-hidden="true">
                📝
              </span>
              <span>Suggest update</span>
            </a>
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-uc-light-card p-4 shadow-uc-card-light ring-1 ring-uc-light-border dark:bg-neutral-800 dark:ring-neutral-700 dark:shadow-uc-card-dark">
              <h2 className="mb-2 flex items-center gap-2 text-sm font-medium text-uc-text-light-muted dark:text-uc-text-dark-muted">
              <span role="img" aria-hidden="true">
                📍
              </span>
              Address
            </h2>
            {addressLines.length ? (
                <p className="text-sm text-uc-text-light-default dark:text-uc-text-dark-default">
                {addressLines.map((line, idx) => (
                  <span key={`${line}-${idx}`} className="block">
                    {line}
                  </span>
                ))}
              </p>
            ) : (
                <p className="text-sm text-uc-text-light-muted dark:text-uc-text-dark-muted">Address coming soon</p>
            )}
          </div>
            <div className="rounded-2xl bg-uc-light-card p-4 shadow-uc-card-light ring-1 ring-uc-light-border dark:bg-neutral-800 dark:ring-neutral-700 dark:shadow-uc-card-dark">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-medium text-uc-text-light-muted dark:text-uc-text-dark-muted">
                <span role="img" aria-hidden="true">
                  🕒
                </span>
                ETA from you
              </h2>
              <button
                type="button"
                onClick={requestEta}
                  className="text-xs font-semibold text-uc-text-light-muted underline-offset-2 hover:text-uc-text-light-default hover:underline dark:text-uc-text-dark-muted dark:hover:text-uc-text-dark-default"
              >
                Update from my location
              </button>
            </div>
            {etaState.status === 'loading' ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-4 w-28 rounded-full bg-uc-light-border dark:bg-neutral-700" />
                  <div className="h-3 w-40 rounded-full bg-uc-light-subtle dark:bg-neutral-700/80" />
                </div>
            ) : etaState.status === 'ready' ? (
              <>
                  <p className="text-sm text-uc-text-light-default dark:text-uc-text-dark-default">
                    <span className="text-lg font-semibold text-uc-text-light-default dark:text-uc-text-dark-default">
                    {etaState.etaMinutes} min
                  </span>
                  {etaState.distanceMiles && (
                    <>
                        <span className="mx-1 text-uc-text-light-subtle dark:text-uc-text-dark-subtle">•</span>
                        <span className="text-sm text-uc-text-light-muted dark:text-uc-text-dark-muted">
                        {etaState.distanceMiles.toFixed(1)} mi
                      </span>
                    </>
                  )}
                </p>
                  <p className="mt-1 text-xs text-uc-text-light-muted dark:text-uc-text-dark-muted">
                    Based on your current GPS location
                  </p>
              </>
            ) : etaState.status === 'error' ? (
                <p className="text-xs text-amber-600">{etaState.errorMessage}</p>
            ) : (
                <p className="text-sm text-uc-text-light-muted dark:text-uc-text-dark-muted">
                  Tap “Update from my location” to calculate ETA.
                </p>
            )}
          </div>
        </div>

        <div className="mb-6 rounded-2xl bg-uc-light-card p-4 shadow-uc-card-light ring-1 ring-uc-light-border dark:bg-uc-dark-card dark:ring-uc-dark-border dark:shadow-uc-card-dark">
          <h2 className="mb-3 text-sm font-medium text-uc-text-light-muted dark:text-uc-text-dark-muted">Quick actions</h2>
          <div className="grid gap-3 md:grid-cols-3">
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                if (hospital.squadPhone) {
                  window.open(`tel:${hospital.squadPhone}`, '_self')
                }
              }}
              disabled={!hospital.squadPhone}
              className="flex w-full items-center gap-3 rounded-xl bg-uc-red-600 px-4 py-3 text-left font-semibold text-white shadow-sm transition hover:bg-uc-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-uc-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:bg-uc-red-600/60 dark:focus-visible:ring-offset-neutral-800"
            >
              <span aria-hidden="true">📞</span>
              <div className="flex flex-col leading-tight">
                <span className="text-sm">Squad Phone</span>
                <span className="text-sm">{hospital.squadPhone ?? 'Not set'}</span>
              </div>
            </motion.button>
              <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigationQuery && setShowNavModal(true)}
                className="flex w-full items-center gap-3 rounded-xl bg-neutral-600 px-4 py-3 text-left font-semibold text-white shadow-sm transition hover:bg-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:bg-neutral-600/40 dark:bg-neutral-700 dark:hover:bg-neutral-600 dark:focus-visible:ring-neutral-500 dark:focus-visible:ring-offset-neutral-800"
              disabled={!navigationQuery}
            >
              <span aria-hidden="true">🧭</span>
              <div className="flex flex-col leading-tight">
                <span className="text-sm">Navigate</span>
                  <span className="text-xs text-white/80">
                  {navigationQuery ? 'Open preferred maps app' : 'Add address / coordinates'}
                </span>
              </div>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                if (primaryDoorCode?.code) {
                  navigator.clipboard?.writeText(primaryDoorCode.code).catch(() => null)
                }
              }}
              className="flex w-full items-center gap-3 rounded-xl bg-amber-500 px-4 py-3 text-left font-semibold text-white shadow-sm transition hover:bg-amber-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-neutral-800"
            >
              <span aria-hidden="true">🔑</span>
              <div className="flex flex-col leading-tight">
                <span className="text-sm">ED Door Code</span>
                <span className="text-sm">{primaryDoorCode?.code ?? '—'}</span>
              </div>
            </motion.button>
          </div>
        </div>

        <div className="space-y-4">
          {capabilityBadges.length > 0 && (
            <div className="rounded-2xl bg-uc-light-card p-4 shadow-uc-card-light ring-1 ring-uc-light-border dark:bg-neutral-800 dark:ring-neutral-700 dark:shadow-uc-card-dark">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-uc-text-light-muted dark:text-uc-text-dark-muted">
                <span role="img" aria-hidden="true">
                  🏥
                </span>
                Clinical capabilities
              </h2>
              <div className="flex flex-wrap gap-2">
                {capabilityBadges.map((badge) => (
                  <motion.button
                    key={badge.id}
                    type="button"
                    whileHover={{ y: -2 }}
                    className={`group relative inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${badge.color.pill}`}
                  >
                    <span className={badge.color.text}>
                      {badge.name}
                      {badge.level ? ` – ${badge.level}` : ''}
                    </span>
                    {badge.description && (
                      <span
                        className={`pointer-events-none absolute left-0 top-full z-10 mt-1 w-56 rounded-lg ${badge.color.tooltip} px-3 py-2 text-[11px] font-normal opacity-0 shadow-lg transition group-hover:opacity-100 group-focus-visible:opacity-100`}
                      >
                        {badge.description}
                      </span>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {hospital.helipad && (hospital.helipad.identifier || hospital.helipad.preferredApproach || hospital.helipad.notes) && (
            <div className="rounded-2xl bg-uc-light-card p-4 shadow-uc-card-light ring-1 ring-uc-light-border dark:bg-neutral-800 dark:ring-neutral-700 dark:shadow-uc-card-dark">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-uc-text-light-muted dark:text-uc-text-dark-muted">
                <span role="img" aria-hidden="true">
                  🚁
                </span>
                Helipad
              </h2>
              {hospital.helipad.identifier && (
                <p className="text-sm text-uc-text-light-default dark:text-uc-text-dark-default">
                  Helipad: <span className="font-medium">{hospital.helipad.identifier}</span>
                </p>
              )}
              <p className="text-sm text-uc-text-light-default dark:text-uc-text-dark-default">
                Night operations: {hospital.helipad.nightOperations ? 'Yes' : 'No'}
              </p>
              {hospital.helipad.preferredApproach && (
                <p className="text-sm text-uc-text-light-default dark:text-uc-text-dark-default">
                  Preferred approach: {hospital.helipad.preferredApproach}
                </p>
              )}
              {hospital.helipad.notes && (
                <p className="text-sm text-uc-text-light-default dark:text-uc-text-dark-default">{hospital.helipad.notes}</p>
              )}
            </div>
          )}

          <div className="rounded-2xl bg-uc-light-card p-4 shadow-uc-card-light ring-1 ring-uc-light-border dark:bg-uc-dark-card dark:ring-uc-dark-border dark:shadow-uc-card-dark">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-uc-text-light-muted dark:text-uc-text-dark-muted">
              <span role="img" aria-hidden="true">
                🗺️
              </span>
              Campus maps
            </h2>
              <div className="mb-3 inline-flex flex-wrap rounded-full bg-uc-light-subtle p-1 text-xs font-medium text-uc-text-light-muted dark:bg-neutral-700 dark:text-uc-text-dark-muted">
              {campusTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveMapTab(tab.id)}
                  className={`rounded-full px-3 py-1 transition ${
                    activeMapTab === tab.id
                        ? 'bg-uc-light-card text-uc-text-light-default shadow-sm dark:bg-neutral-800 dark:text-uc-text-dark-default'
                        : 'text-uc-text-light-muted hover:text-uc-text-light-default dark:text-uc-text-dark-muted dark:hover:text-uc-text-dark-default'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
              <div className="flex h-48 items-center justify-center overflow-hidden rounded-xl bg-uc-light-subtle text-xs text-uc-text-light-muted dark:bg-neutral-700 dark:text-uc-text-dark-muted">
              {campusTabs.map((tab) => {
                if (tab.id !== activeMapTab) return null
                const emoji = 'mapType' in tab ? mapTypeEmoji[tab.mapType as string] ?? '🗺️' : '🗺️'
                if ('media' in tab && tab.media?.url) {
                  return (
                    <div key={tab.id} className="relative h-full w-full">
                      <Image
                        src={tab.media.url}
                        alt={tab.media.alt || tab.label}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                      {tab.externalUrl && (
                        <button
                          onClick={() => window.open(tab.externalUrl, '_blank', 'noopener')}
                          className="absolute bottom-3 right-3 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-uc-text-light-default shadow"
                        >
                          Open full map
                        </button>
                      )}
                    </div>
                  )
                }
                return (
                  <span key={tab.id} className="px-4 text-center text-sm">
                    {emoji} {tab.description}
                  </span>
                )
              })}
            </div>
          </div>

          {otherContacts.length > 0 && (
            <div className="rounded-2xl bg-uc-light-card p-4 shadow-uc-card-light ring-1 ring-uc-light-border dark:bg-neutral-800 dark:ring-neutral-700 dark:shadow-uc-card-dark">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-uc-text-light-muted dark:text-uc-text-dark-muted">
                <span role="img" aria-hidden="true">
                  ☎️
                </span>
                Other contacts
              </h2>
              <div className="space-y-3 text-sm">
                  {otherContacts.map((contact, idx) => (
                    <div
                      key={`${contact?.label}-${idx}`}
                      className="flex flex-col gap-2 rounded-xl ring-1 ring-uc-light-border bg-uc-light-subtle px-3 py-2 dark:ring-neutral-700 dark:bg-neutral-700"
                    >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-medium text-uc-text-light-default dark:text-uc-text-dark-default">{contact?.label}</p>
                        {contact?.description && (
                          <p className="text-xs text-uc-text-light-muted dark:text-uc-text-dark-muted">{contact.description}</p>
                        )}
                      </div>
                        <a
                          href={`tel:${contact?.phoneNumber}`}
                          className="text-sm font-semibold text-uc-text-light-default underline decoration-uc-light-border underline-offset-2 hover:text-uc-red-700 dark:text-uc-text-dark-default dark:hover:text-uc-red-300"
                        >
                        {formatPhone(contact?.phoneNumber ?? '')}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(hazards.length > 0 || hospital.notes) && (
            <div className="rounded-2xl bg-uc-light-card p-4 shadow-uc-card-light ring-1 ring-uc-light-border dark:bg-neutral-800 dark:ring-neutral-700 dark:shadow-uc-card-dark">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-uc-text-light-muted dark:text-uc-text-dark-muted">
                <span role="img" aria-hidden="true">
                  ⚠️
                </span>
                Notes & hazards
              </h2>
              <ul className="ml-4 list-disc space-y-1 text-sm text-uc-text-light-default dark:text-uc-text-dark-default">
                {hospital.notes && <li>{hospital.notes}</li>}
                {hazards.map((hazard, idx) => (
                  <li key={`${hazard?.note}-${idx}`}>{hazard?.note}</li>
                ))}
              </ul>
            </div>
          )}

          {doorCodes.length > 0 && (
            <div className="rounded-2xl bg-uc-light-card p-4 shadow-uc-card-light ring-1 ring-uc-light-border dark:bg-neutral-800 dark:ring-neutral-700 dark:shadow-uc-card-dark">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-uc-text-light-muted dark:text-uc-text-dark-muted">
                <span role="img" aria-hidden="true">
                  🔑
                </span>
                Other Door Codes
              </h2>
              <DoorCodeList doorCodes={doorCodes} />
            </div>
          )}
        </div>

        <p className="mt-4 text-xs text-uc-text-light-muted dark:text-uc-text-dark-muted">
          {lastUpdated && `Last updated ${lastUpdated.toLocaleDateString()} • `} {sourceAttribution}
        </p>
      </div>

        <AnimatePresence>
          {showNavModal && navigationQuery && (
            <motion.div
              className="fixed inset-0 z-30 flex items-center justify-center bg-neutral-800/40 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="w-full max-w-sm rounded-2xl bg-uc-light-card p-4 shadow-uc-card-light ring-1 ring-uc-light-border dark:bg-neutral-800 dark:ring-neutral-700"
                initial={{ scale: 0.95, y: 10, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.95, y: 10, opacity: 0 }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-uc-text-light-muted dark:text-uc-text-dark-muted">Open navigation</h3>
                  <button
                    onClick={() => setShowNavModal(false)}
                    className="rounded-full p-1 text-uc-text-light-subtle hover:bg-uc-light-subtle hover:text-uc-text-light-default dark:text-uc-text-dark-subtle dark:hover:bg-neutral-700 dark:hover:text-uc-text-dark-default"
                  >
                    ✕
                  </button>
                </div>
                <p className="mb-3 text-xs text-uc-text-light-muted dark:text-uc-text-dark-muted">
                  Choose how you want to open directions to {hospital.name}.
                </p>
                <div className="space-y-2 text-sm">
                  <button
                    onClick={() => handleOpenNavigation('google')}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left ring-1 ring-uc-light-border transition hover:bg-uc-light-subtle dark:ring-neutral-700 dark:hover:bg-neutral-700"
                  >
                    <span className="flex items-center gap-2">
                      <span>🟢</span>
                      <span>Google Maps</span>
                    </span>
                    <span className="text-xs text-uc-text-light-subtle dark:text-uc-text-dark-subtle">Default</span>
                  </button>
                  <button
                    onClick={() => handleOpenNavigation('apple')}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left ring-1 ring-uc-light-border transition hover:bg-uc-light-subtle dark:ring-neutral-700 dark:hover:bg-neutral-700"
                  >
                    <span>🍎</span>
                    <span>Apple Maps</span>
                  </button>
                  <button
                    onClick={() => handleOpenNavigation('waze')}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left ring-1 ring-uc-light-border transition hover:bg-uc-light-subtle dark:ring-neutral-700 dark:hover:bg-neutral-700"
                  >
                    <span>🚘</span>
                    <span>Waze</span>
                  </button>
                </div>
                <div className="mt-4 border-t border-uc-light-border pt-3 dark:border-neutral-700">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-uc-text-light-muted dark:text-uc-text-dark-muted">
                    Share with crew
                  </p>
                  <button
                    onClick={handleCopyAllInfo}
                    className="flex w-full items-center gap-2 rounded-xl bg-neutral-800 px-3 py-2 text-xs font-medium text-white hover:bg-black dark:bg-uc-light-card dark:text-uc-text-light-default"
                  >
                    <span>📤</span>
                    <span>Share location &amp; address</span>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
    </div>
  )
}
