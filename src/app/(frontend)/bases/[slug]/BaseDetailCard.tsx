'use client'

import { useCallback, useMemo, useState } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import type { Base, HospitalNetwork, Asset, Media } from '@/payload-types'
import { DoorCodeList } from '@/components/door-code-list'
import { calculateDistanceMiles, estimateEtaMinutes } from '@/utilities/distance'

interface BaseDetailCardProps {
  base: Base
  network?: HospitalNetwork | null
  networkLogo?: Media | null
}

const assetColorsByType: Record<string, { pill: string; text: string; tooltip: string }> = {
  bls: {
    pill: 'bg-emerald-50 ring-emerald-100 dark:bg-emerald-900/20 dark:ring-emerald-800',
    text: 'text-emerald-800 dark:text-emerald-200',
    tooltip: 'bg-slate-900 text-slate-100',
  },
  als: {
    pill: 'bg-emerald-50 ring-emerald-100 dark:bg-emerald-900/20 dark:ring-emerald-800',
    text: 'text-emerald-800 dark:text-emerald-200',
    tooltip: 'bg-slate-900 text-slate-100',
  },
  micu: {
    pill: 'bg-sky-50 ring-sky-100 dark:bg-sky-900/20 dark:ring-sky-800',
    text: 'text-sky-800 dark:text-sky-200',
    tooltip: 'bg-slate-900 text-slate-100',
  },
  cct: {
    pill: 'bg-sky-50 ring-sky-100 dark:bg-sky-900/20 dark:ring-sky-800',
    text: 'text-sky-800 dark:text-sky-200',
    tooltip: 'bg-slate-900 text-slate-100',
  },
  helicopter: {
    pill: 'bg-purple-50 ring-purple-100 dark:bg-purple-900/20 dark:ring-purple-800',
    text: 'text-purple-800 dark:text-purple-200',
    tooltip: 'bg-slate-900 text-slate-100',
  },
  chase: {
    pill: 'bg-amber-50 ring-amber-100 dark:bg-amber-900/20 dark:ring-amber-800',
    text: 'text-amber-800 dark:text-amber-200',
    tooltip: 'bg-slate-900 text-slate-100',
  },
  support: {
    pill: 'bg-slate-50 ring-slate-100 dark:bg-slate-700/20 dark:ring-slate-600',
    text: 'text-slate-800 dark:text-slate-200',
    tooltip: 'bg-slate-900 text-slate-100',
  },
  other: {
    pill: 'bg-slate-50 ring-slate-100 dark:bg-slate-700/20 dark:ring-slate-600',
    text: 'text-slate-800 dark:text-slate-200',
    tooltip: 'bg-slate-900 text-slate-100',
  },
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

export function BaseDetailCard({ base, network, networkLogo }: BaseDetailCardProps) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle')
  const [showNavModal, setShowNavModal] = useState(false)
  const [etaState, setEtaState] = useState<{
    status: 'idle' | 'loading' | 'ready' | 'error'
    etaMinutes?: number
    distanceMiles?: number
    errorMessage?: string
  }>({ status: 'idle' })

  const addressLines = useMemo(() => {
    const line1 = base.address?.line1?.trim()
    const line2 = base.address?.line2?.trim()
    const city = base.address?.city?.trim()
    const state = base.address?.state?.trim()
    const zip = base.address?.zip?.trim()
    const cityLine = [city, state].filter(Boolean).join(', ')
    const lines = [line1, line2, [cityLine, zip].filter(Boolean).join(' ').trim()].filter(Boolean)
    return lines as string[]
  }, [base.address])

  const navigationQuery = useMemo(() => {
    if (typeof base.latitude === 'number' && typeof base.longitude === 'number') {
      return {
        type: 'coords' as const,
        value: `${base.latitude},${base.longitude}`,
      }
    }
    const query = addressLines.join(', ')
    return query
      ? {
          type: 'address' as const,
          value: query,
        }
      : null
  }, [addressLines, base.latitude, base.longitude])

  const doorCodes = useMemo(() => base.doorCodes ?? [], [base.doorCodes])
  const primaryDoorCode = useMemo(() => {
    return doorCodes[0] ?? null
  }, [doorCodes])

  const otherContacts = (base.contactInfo ?? []).filter(
    (contact) => contact?.phoneNumber?.trim() && contact?.label?.trim(),
  )

  const hazards = (base.hazards ?? []).filter((item) => item?.note?.trim())

  const assets = useMemo(() => {
    if (!base.assets) return []
    return base.assets
      .map((assetRef) => {
        const asset = typeof assetRef === 'object' ? (assetRef as Asset) : null
        if (!asset) return null

        const type = asset.type ?? 'other'
        const color = assetColorsByType[type] ?? assetColorsByType.other

        return {
          id: asset.id,
          name: asset.name,
          emoji: asset.emoji || '🚑',
          type,
          capabilities: asset.capabilities,
          color,
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
  }, [base.assets])

  const handleCopyAllInfo = useCallback(() => {
    const infoLines = [
      base.name,
      network?.name ? `Network: ${network.name}` : null,
      addressLines.length ? `Address: ${addressLines.join(', ')}` : null,
      primaryDoorCode?.code ? `Door Code: ${primaryDoorCode.code}` : null,
      base.squadPhone ? `Squad Phone: ${base.squadPhone}` : null,
      assets.length
        ? `Assets: ${assets.map((a) => a?.name).join('; ')}`
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
          title: base.name,
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
  }, [addressLines, assets, base.name, base.squadPhone, network?.name, primaryDoorCode?.code])

  const requestEta = useCallback(() => {
    if (!navigator.geolocation) {
      setEtaState({
        status: 'error',
        errorMessage: 'Location not supported on this device.',
      })
      return
    }
    if (typeof base.latitude !== 'number' || typeof base.longitude !== 'number') {
      setEtaState({
        status: 'error',
        errorMessage: 'Base is missing GPS coordinates.',
      })
      return
    }
    setEtaState({ status: 'loading' })
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const distance = calculateDistanceMiles(
          position.coords.latitude,
          position.coords.longitude,
          base.latitude as number,
          base.longitude as number,
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
  }, [base.latitude, base.longitude])

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
    base.sourceAttribution?.trim() ?? 'Source: Air Care & Mobile Care education team'
  const lastUpdated = base.updatedAt ? new Date(base.updatedAt) : null

  return (
    <div className="rounded-3xl bg-uc-light-card text-uc-text-light-default ring-1 ring-uc-light-border dark:bg-neutral-800 dark:text-uc-text-dark-default dark:ring-neutral-700">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {networkLogo?.url ? (
              <Image
                src={networkLogo.url}
                alt={networkLogo.alt || `${network?.name ?? base.name} logo`}
                width={48}
                height={48}
                className="h-12 w-12 rounded-full bg-white p-0.5 ring-1 ring-uc-light-border object-cover dark:bg-neutral-800 dark:ring-neutral-700"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white ring-1 ring-uc-light-border dark:bg-neutral-800 dark:ring-neutral-700">
                <span className="text-lg font-semibold text-uc-text-light-default dark:text-uc-text-dark-default">
                  {base.name?.[0]?.toUpperCase() ?? '🏢'}
                </span>
              </div>
            )}
            <div className="flex flex-col leading-tight">
              <h1 className="text-2xl font-bold">{base.name}</h1>
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
              className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-uc-text-light-muted ring-1 ring-uc-light-border transition hover:bg-uc-light-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-uc-red-200 dark:bg-neutral-700/80 dark:text-uc-text-dark-muted dark:ring-neutral-600"
            >
              <span role="img" aria-hidden="true">
                📋
              </span>
              <span>{copyState === 'copied' ? 'Copied' : copyState === 'error' ? 'Try again' : 'Share info'}</span>
            </button>
            <a
              href={`mailto:?subject=Base info update: ${encodeURIComponent(base.name ?? '')}`}
              className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-uc-text-light-muted ring-1 ring-uc-light-border transition hover:bg-uc-light-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-uc-red-200 dark:bg-neutral-700/80 dark:text-uc-text-dark-muted dark:ring-neutral-600"
            >
              <span role="img" aria-hidden="true">
                📝
              </span>
              <span>Suggest update</span>
            </a>
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-uc-light-card p-4 ring-1 ring-uc-light-border dark:bg-neutral-800 dark:ring-neutral-700">
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
          <div className="rounded-2xl bg-uc-light-card p-4 ring-1 ring-uc-light-border dark:bg-neutral-800 dark:ring-neutral-700">
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
                Tap &ldquo;Update from my location&rdquo; to calculate ETA.
              </p>
            )}
          </div>
        </div>

        <div className="mb-6 rounded-2xl bg-uc-light-card p-4 ring-1 ring-uc-light-border dark:bg-neutral-800 dark:ring-neutral-700">
          <h2 className="mb-3 text-sm font-medium text-uc-text-light-muted dark:text-uc-text-dark-muted">Quick actions</h2>
          <div className="grid gap-3 md:grid-cols-3">
            <button
              onClick={() => {
                if (base.squadPhone) {
                  window.open(`tel:${base.squadPhone}`, '_self')
                }
              }}
              disabled={!base.squadPhone}
              className="flex w-full items-center gap-3 rounded-xl bg-uc-red-600 px-4 py-3 text-left font-semibold text-white transition hover:bg-uc-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-uc-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:bg-uc-red-600/60 dark:focus-visible:ring-offset-neutral-800"
            >
              <span aria-hidden="true">📞</span>
              <div className="flex flex-col leading-tight">
                <span className="text-sm">Squad Phone</span>
                <span className="text-sm">{base.squadPhone ?? 'Not set'}</span>
              </div>
            </button>
            <button
              onClick={() => navigationQuery && setShowNavModal(true)}
              className="flex w-full items-center gap-3 rounded-xl bg-neutral-600 px-4 py-3 text-left font-semibold text-white transition hover:bg-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:bg-neutral-600/40 dark:bg-neutral-700 dark:hover:bg-neutral-600 dark:focus-visible:ring-neutral-500 dark:focus-visible:ring-offset-neutral-800"
              disabled={!navigationQuery}
            >
              <span aria-hidden="true">🧭</span>
              <div className="flex flex-col leading-tight">
                <span className="text-sm">Navigate</span>
                <span className="text-xs text-white/80">
                  {navigationQuery ? 'Open preferred maps app' : 'Add address / coordinates'}
                </span>
              </div>
            </button>
            <button
              onClick={() => {
                if (primaryDoorCode?.code) {
                  navigator.clipboard?.writeText(primaryDoorCode.code).catch(() => null)
                }
              }}
              className="flex w-full items-center gap-3 rounded-xl bg-amber-500 px-4 py-3 text-left font-semibold text-white transition hover:bg-amber-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-neutral-800"
            >
              <span aria-hidden="true">🔑</span>
              <div className="flex flex-col leading-tight">
                <span className="text-sm">Door Code</span>
                <span className="text-sm">{primaryDoorCode?.code ?? '—'}</span>
              </div>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {assets.length > 0 && (
            <div className="rounded-2xl bg-uc-light-card p-4 ring-1 ring-uc-light-border dark:bg-neutral-800 dark:ring-neutral-700">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-uc-text-light-muted dark:text-uc-text-dark-muted">
                <span role="img" aria-hidden="true">
                  🚑
                </span>
                Assets at this base
              </h2>
              <div className="flex flex-wrap gap-2">
                {assets.map((asset) => (
                  <button
                    key={asset.id}
                    type="button"
                    className={`group relative inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${asset.color.pill}`}
                  >
                    <span className="text-[13px]">{asset.emoji}</span>
                    <span className={asset.color.text}>{asset.name}</span>
                    {asset.capabilities && (
                      <span
                        className={`pointer-events-none absolute left-0 top-full z-10 mt-1 w-56 rounded-lg ${asset.color.tooltip} px-3 py-2 text-[11px] font-normal opacity-0 shadow-lg transition group-hover:opacity-100 group-focus-visible:opacity-100`}
                      >
                        {asset.capabilities}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {otherContacts.length > 0 && (
            <div className="rounded-2xl bg-uc-light-card p-4 ring-1 ring-uc-light-border dark:bg-neutral-800 dark:ring-neutral-700">
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

          {(hazards.length > 0 || base.notes) && (
            <div className="rounded-2xl bg-uc-light-card p-4 ring-1 ring-uc-light-border dark:bg-neutral-800 dark:ring-neutral-700">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-uc-text-light-muted dark:text-uc-text-dark-muted">
                <span role="img" aria-hidden="true">
                  ⚠️
                </span>
                Notes & hazards
              </h2>
              <ul className="ml-4 list-disc space-y-1 text-sm text-uc-text-light-default dark:text-uc-text-dark-default">
                {base.notes && <li>{base.notes}</li>}
                {hazards.map((hazard, idx) => (
                  <li key={`${hazard?.note}-${idx}`}>{hazard?.note}</li>
                ))}
              </ul>
            </div>
          )}

          {doorCodes.length > 0 && (
            <div className="rounded-2xl bg-uc-light-card p-4 ring-1 ring-uc-light-border dark:bg-neutral-800 dark:ring-neutral-700">
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
              className="w-full max-w-sm rounded-2xl bg-uc-light-card p-4 ring-1 ring-uc-light-border dark:bg-neutral-800 dark:ring-neutral-700"
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
                Choose how you want to open directions to {base.name}.
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
