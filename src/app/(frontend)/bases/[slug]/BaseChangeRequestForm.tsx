'use client'

import React, { useState } from 'react'
import type { Base, Asset } from '@/payload-types'

interface BaseChangeRequestFormProps {
  base: Base
  assets: Asset[]
}

type ContactEntry = {
  label: string
  phoneNumber: string
  description?: string
}

type DoorCodeEntry = {
  label: string
  code: string
  notes?: string
}

type AssetChange = {
  assetId: number | null
  action: 'add' | 'remove'
}

type RawContact = NonNullable<Base['contactInfo']>[number]
type RawDoorCode = NonNullable<Base['doorCodes']>[number]

const normalizeContacts = (contactInfo: Base['contactInfo']): ContactEntry[] =>
  (contactInfo ?? [])
    .filter((contact): contact is RawContact => Boolean(contact) && typeof contact === 'object')
    .map((contact) => ({
      label: contact.label ?? '',
      phoneNumber: contact.phoneNumber ?? '',
      description: contact.description ?? '',
    }))

const normalizeDoorCodes = (doorCodes: Base['doorCodes']): DoorCodeEntry[] =>
  (doorCodes ?? [])
    .filter((door): door is RawDoorCode => Boolean(door) && typeof door === 'object')
    .map((door) => ({
      label: door.label ?? '',
      code: door.code ?? '',
      notes: door.notes ?? '',
    }))

const cleanString = (value: string) => value.trim() || undefined

export function BaseChangeRequestForm({ base, assets }: BaseChangeRequestFormProps) {
  const [name, setName] = useState(base.name ?? '')
  const [addressLine1, setAddressLine1] = useState(base.address?.line1 ?? '')
  const [addressLine2, setAddressLine2] = useState(base.address?.line2 ?? '')
  const [city, setCity] = useState(base.address?.city ?? '')
  const [state, setState] = useState(base.address?.state ?? '')
  const [zip, setZip] = useState(base.address?.zip ?? '')
  const [coordinates, setCoordinates] = useState(base.coordinates ?? '')
  const [squadPhone, setSquadPhone] = useState(base.squadPhone ?? '')
  const [contactInfo, setContactInfo] = useState<ContactEntry[]>(normalizeContacts(base.contactInfo))
  const [doorCodes, setDoorCodes] = useState<DoorCodeEntry[]>(normalizeDoorCodes(base.doorCodes))
  const [assetChanges, setAssetChanges] = useState<AssetChange[]>([])
  const [notes, setNotes] = useState('')
  const [hazard, setHazard] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const addContactRow = () => {
    setContactInfo((rows) => [...rows, { label: '', phoneNumber: '', description: '' }])
  }

  const updateContactRow = (index: number, field: keyof ContactEntry, value: string) => {
    setContactInfo((rows) => rows.map((row, idx) => (idx === index ? { ...row, [field]: value } : row)))
  }

  const removeContactRow = (index: number) => {
    setContactInfo((rows) => rows.filter((_, idx) => idx !== index))
  }

  const addDoorCodeRow = () => {
    setDoorCodes((rows) => [...rows, { label: '', code: '', notes: '' }])
  }

  const updateDoorCodeRow = (index: number, field: keyof DoorCodeEntry, value: string) => {
    setDoorCodes((rows) => rows.map((row, idx) => (idx === index ? { ...row, [field]: value } : row)))
  }

  const removeDoorCodeRow = (index: number) => {
    setDoorCodes((rows) => rows.filter((_, idx) => idx !== index))
  }

  const addAssetChange = () => {
    setAssetChanges((rows) => [...rows, { assetId: null, action: 'add' }])
  }

  const updateAssetChange = (index: number, field: keyof AssetChange, value: AssetChange[typeof field]) => {
    setAssetChanges((rows) => rows.map((row, idx) => (idx === index ? { ...row, [field]: value } : row)))
  }

  const removeAssetChange = (index: number) => {
    setAssetChanges((rows) => rows.filter((_, idx) => idx !== index))
  }

  const buildPayload = () => {
    const addressPayload: Record<string, string> = {}

    const line1 = cleanString(addressLine1)
    const line2 = cleanString(addressLine2)
    const cityValue = cleanString(city)
    const stateValue = cleanString(state)
    const zipValue = cleanString(zip)

    if (line1) addressPayload.line1 = line1
    if (line2) addressPayload.line2 = line2
    if (cityValue) addressPayload.city = cityValue
    if (stateValue) addressPayload.state = stateValue
    if (zipValue) addressPayload.zip = zipValue

    const filteredContacts = contactInfo
      .map((contact) => ({
        label: cleanString(contact.label),
        phoneNumber: cleanString(contact.phoneNumber),
        description: cleanString(contact.description ?? ''),
      }))
      .filter((contact) => contact.label || contact.phoneNumber || contact.description)

    const filteredDoorCodes = doorCodes
      .map((door) => ({
        label: cleanString(door.label),
        code: cleanString(door.code),
        notes: cleanString(door.notes ?? ''),
      }))
      .filter((door) => door.label || door.code || door.notes)

    const filteredAssetChanges = assetChanges
      .filter((change) => change.assetId !== null)
      .map((change) => ({
        assetId: change.assetId,
        action: change.action,
      }))

    const proposedData: Record<string, unknown> = {}

    const nameValue = cleanString(name)
    if (nameValue) proposedData.name = nameValue
    if (Object.keys(addressPayload).length > 0) proposedData.address = addressPayload

    const coordinateValue = cleanString(coordinates)
    if (coordinateValue) proposedData.coordinates = coordinateValue

    const squadPhoneValue = cleanString(squadPhone)
    if (squadPhoneValue) proposedData.squadPhone = squadPhoneValue
    if (filteredContacts.length > 0) proposedData.contactInfo = filteredContacts
    if (filteredDoorCodes.length > 0) proposedData.doorCodes = filteredDoorCodes
    if (filteredAssetChanges.length > 0) proposedData.assetChanges = filteredAssetChanges

    const notesValue = cleanString(notes)
    if (notesValue) proposedData.notes = notesValue

    const hazardValue = cleanString(hazard)
    if (hazardValue) {
      proposedData.hazards = [
        {
          note: hazardValue,
        },
      ]
    }

    return proposedData
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setStatus(null)
    setError(null)

    try {
      const proposedData = buildPayload()

      if (Object.keys(proposedData).length === 0) {
        setError('Please add at least one field to update before submitting.')
        setSubmitting(false)
        return
      }

      const response = await fetch('/api/base-change-requests', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'update',
          targetBase: base.id,
          proposedData,
        }),
      })

      if (!response.ok) {
        throw new Error('Unable to submit update request. Please try again.')
      }

      setStatus('Thanks! Your suggested updates were sent to the content team for review.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong submitting your request.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl bg-white p-4 ring-1 ring-uc-light-border dark:bg-neutral-800 dark:ring-neutral-700">
        <h2 className="mb-3 text-base font-semibold">Update base details</h2>
        <p className="mb-4 text-sm text-uc-text-light-muted dark:text-uc-text-dark-muted">
          Share any corrections for this base. Leave fields blank if they don&apos;t need changes.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium">
            Base name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl border border-uc-light-border bg-white px-3 py-2 text-sm text-uc-text-light-default shadow-sm focus:border-uc-red-500 focus:outline-none focus:ring-2 focus:ring-uc-red-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-uc-text-dark-default dark:focus:border-uc-red-400"
              placeholder="Station name"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium">
            Squad phone
            <input
              type="tel"
              value={squadPhone}
              onChange={(e) => setSquadPhone(e.target.value)}
              className="rounded-xl border border-uc-light-border bg-white px-3 py-2 text-sm text-uc-text-light-default shadow-sm focus:border-uc-red-500 focus:outline-none focus:ring-2 focus:ring-uc-red-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-uc-text-dark-default dark:focus:border-uc-red-400"
              placeholder="(734) 555-1234"
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium">
            Address line 1
            <input
              type="text"
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              className="rounded-xl border border-uc-light-border bg-white px-3 py-2 text-sm text-uc-text-light-default shadow-sm focus:border-uc-red-500 focus:outline-none focus:ring-2 focus:ring-uc-red-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-uc-text-dark-default dark:focus:border-uc-red-400"
              placeholder="123 Main St"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium">
            Address line 2
            <input
              type="text"
              value={addressLine2}
              onChange={(e) => setAddressLine2(e.target.value)}
              className="rounded-xl border border-uc-light-border bg-white px-3 py-2 text-sm text-uc-text-light-default shadow-sm focus:border-uc-red-500 focus:outline-none focus:ring-2 focus:ring-uc-red-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-uc-text-dark-default dark:focus:border-uc-red-400"
              placeholder="Suite / Floor"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium">
            City
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="rounded-xl border border-uc-light-border bg-white px-3 py-2 text-sm text-uc-text-light-default shadow-sm focus:border-uc-red-500 focus:outline-none focus:ring-2 focus:ring-uc-red-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-uc-text-dark-default dark:focus:border-uc-red-400"
              placeholder="City"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-2 text-sm font-medium">
              State
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="rounded-xl border border-uc-light-border bg-white px-3 py-2 text-sm text-uc-text-light-default shadow-sm focus:border-uc-red-500 focus:outline-none focus:ring-2 focus:ring-uc-red-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-uc-text-dark-default dark:focus:border-uc-red-400"
                placeholder="OH"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium">
              ZIP
              <input
                type="text"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                className="rounded-xl border border-uc-light-border bg-white px-3 py-2 text-sm text-uc-text-light-default shadow-sm focus:border-uc-red-500 focus:outline-none focus:ring-2 focus:ring-uc-red-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-uc-text-dark-default dark:focus:border-uc-red-400"
                placeholder="45219"
              />
            </label>
          </div>
        </div>

        <label className="mt-3 flex flex-col gap-2 text-sm font-medium">
          Coordinates (lat, lon)
          <input
            type="text"
            value={coordinates}
            onChange={(e) => setCoordinates(e.target.value)}
            className="rounded-xl border border-uc-light-border bg-white px-3 py-2 text-sm text-uc-text-light-default shadow-sm focus:border-uc-red-500 focus:outline-none focus:ring-2 focus:ring-uc-red-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-uc-text-dark-default dark:focus:border-uc-red-400"
            placeholder="39.136774, -84.502021"
          />
        </label>
      </div>

      <div className="rounded-2xl bg-white p-4 ring-1 ring-uc-light-border dark:bg-neutral-800 dark:ring-neutral-700">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold">Other contacts</h3>
            <p className="text-sm text-uc-text-light-muted dark:text-uc-text-dark-muted">
              Add supervisors, security, or other direct lines.
            </p>
          </div>
          <button
            type="button"
            onClick={addContactRow}
            className="rounded-full bg-uc-light-subtle px-3 py-1 text-sm font-medium text-uc-text-light-default ring-1 ring-uc-light-border transition hover:bg-uc-light-card dark:bg-neutral-700 dark:text-uc-text-dark-default dark:ring-neutral-600"
          >
            + Add contact
          </button>
        </div>

        {contactInfo.length === 0 && (
          <p className="text-sm text-uc-text-light-muted dark:text-uc-text-dark-muted">No extra contacts added yet.</p>
        )}

        <div className="space-y-3">
          {contactInfo.map((contact, index) => (
            <div key={index} className="rounded-xl border border-uc-light-border p-3 dark:border-neutral-700">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-medium">Contact {index + 1}</p>
                <button
                  type="button"
                  onClick={() => removeContactRow(index)}
                  className="text-xs text-uc-text-light-muted underline decoration-dashed underline-offset-4 transition hover:text-uc-text-light-default dark:text-uc-text-dark-muted dark:hover:text-uc-text-dark-default"
                >
                  Remove
                </button>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <label className="flex flex-col gap-2 text-sm font-medium">
                  Label
                  <input
                    type="text"
                    value={contact.label}
                    onChange={(e) => updateContactRow(index, 'label', e.target.value)}
                    className="rounded-xl border border-uc-light-border bg-white px-3 py-2 text-sm text-uc-text-light-default shadow-sm focus:border-uc-red-500 focus:outline-none focus:ring-2 focus:ring-uc-red-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-uc-text-dark-default dark:focus:border-uc-red-400"
                    placeholder="Supervisor"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium">
                  Phone number
                  <input
                    type="tel"
                    value={contact.phoneNumber}
                    onChange={(e) => updateContactRow(index, 'phoneNumber', e.target.value)}
                    className="rounded-xl border border-uc-light-border bg-white px-3 py-2 text-sm text-uc-text-light-default shadow-sm focus:border-uc-red-500 focus:outline-none focus:ring-2 focus:ring-uc-red-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-uc-text-dark-default dark:focus:border-uc-red-400"
                    placeholder="(734) 555-5678"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium">
                  Notes
                  <input
                    type="text"
                    value={contact.description}
                    onChange={(e) => updateContactRow(index, 'description', e.target.value)}
                    className="rounded-xl border border-uc-light-border bg-white px-3 py-2 text-sm text-uc-text-light-default shadow-sm focus:border-uc-red-500 focus:outline-none focus:ring-2 focus:ring-uc-red-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-uc-text-dark-default dark:focus:border-uc-red-400"
                    placeholder="When to use this line"
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4 ring-1 ring-uc-light-border dark:bg-neutral-800 dark:ring-neutral-700">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold">Door codes</h3>
            <p className="text-sm text-uc-text-light-muted dark:text-uc-text-dark-muted">Access details for the crew.</p>
          </div>
          <button
            type="button"
            onClick={addDoorCodeRow}
            className="rounded-full bg-uc-light-subtle px-3 py-1 text-sm font-medium text-uc-text-light-default ring-1 ring-uc-light-border transition hover:bg-uc-light-card dark:bg-neutral-700 dark:text-uc-text-dark-default dark:ring-neutral-600"
          >
            + Add door code
          </button>
        </div>

        {doorCodes.length === 0 && (
          <p className="text-sm text-uc-text-light-muted dark:text-uc-text-dark-muted">No door codes to update yet.</p>
        )}

        <div className="space-y-3">
          {doorCodes.map((door, index) => (
            <div key={index} className="rounded-xl border border-uc-light-border p-3 dark:border-neutral-700">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-medium">Door {index + 1}</p>
                <button
                  type="button"
                  onClick={() => removeDoorCodeRow(index)}
                  className="text-xs text-uc-text-light-muted underline decoration-dashed underline-offset-4 transition hover:text-uc-text-light-default dark:text-uc-text-dark-muted dark:hover:text-uc-text-dark-default"
                >
                  Remove
                </button>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <label className="flex flex-col gap-2 text-sm font-medium">
                  Label
                  <input
                    type="text"
                    value={door.label}
                    onChange={(e) => updateDoorCodeRow(index, 'label', e.target.value)}
                    className="rounded-xl border border-uc-light-border bg-white px-3 py-2 text-sm text-uc-text-light-default shadow-sm focus:border-uc-red-500 focus:outline-none focus:ring-2 focus:ring-uc-red-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-uc-text-dark-default dark:focus:border-uc-red-400"
                    placeholder="Front entrance"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium">
                  Code
                  <input
                    type="text"
                    value={door.code}
                    onChange={(e) => updateDoorCodeRow(index, 'code', e.target.value)}
                    className="rounded-xl border border-uc-light-border bg-white px-3 py-2 text-sm text-uc-text-light-default shadow-sm focus:border-uc-red-500 focus:outline-none focus:ring-2 focus:ring-uc-red-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-uc-text-dark-default dark:focus:border-uc-red-400"
                    placeholder="1234#"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium">
                  Notes
                  <input
                    type="text"
                    value={door.notes}
                    onChange={(e) => updateDoorCodeRow(index, 'notes', e.target.value)}
                    className="rounded-xl border border-uc-light-border bg-white px-3 py-2 text-sm text-uc-text-light-default shadow-sm focus:border-uc-red-500 focus:outline-none focus:ring-2 focus:ring-uc-red-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-uc-text-dark-default dark:focus:border-uc-red-400"
                    placeholder="Nights only, call on arrival"
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4 ring-1 ring-uc-light-border dark:bg-neutral-800 dark:ring-neutral-700">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold">Assets</h3>
            <p className="text-sm text-uc-text-light-muted dark:text-uc-text-dark-muted">
              Add or remove vehicles and units at this base.
            </p>
          </div>
          <button
            type="button"
            onClick={addAssetChange}
            className="rounded-full bg-uc-light-subtle px-3 py-1 text-sm font-medium text-uc-text-light-default ring-1 ring-uc-light-border transition hover:bg-uc-light-card dark:bg-neutral-700 dark:text-uc-text-dark-default dark:ring-neutral-600"
          >
            + Add asset change
          </button>
        </div>

        {assetChanges.length === 0 && (
          <p className="text-sm text-uc-text-light-muted dark:text-uc-text-dark-muted">
            No asset changes yet.
          </p>
        )}

        <div className="space-y-3">
          {assetChanges.map((change, index) => {
            const selectedAsset = assets.find((a) => a.id === change.assetId)

            return (
              <div key={index} className="rounded-xl border border-uc-light-border p-3 dark:border-neutral-700">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">Asset change {index + 1}</p>
                  <button
                    type="button"
                    onClick={() => removeAssetChange(index)}
                    className="text-xs text-uc-text-light-muted underline decoration-dashed underline-offset-4 transition hover:text-uc-text-light-default dark:text-uc-text-dark-muted dark:hover:text-uc-text-dark-default"
                  >
                    Remove
                  </button>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="flex flex-col gap-2 text-sm font-medium">
                    Action
                    <select
                      value={change.action}
                      onChange={(e) => updateAssetChange(index, 'action', e.target.value)}
                      className="rounded-xl border border-uc-light-border bg-white px-3 py-2 text-sm text-uc-text-light-default shadow-sm focus:border-uc-red-500 focus:outline-none focus:ring-2 focus:ring-uc-red-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-uc-text-dark-default dark:focus:border-uc-red-400 dark:focus:ring-uc-red-900/30"
                    >
                      <option value="add">Add to base</option>
                      <option value="remove">Remove from base</option>
                    </select>
                  </label>
                  <label className="flex flex-col gap-2 text-sm font-medium">
                    Asset
                    <select
                      value={change.assetId ?? ''}
                      onChange={(e) => updateAssetChange(index, 'assetId', Number(e.target.value) || null)}
                      className="rounded-xl border border-uc-light-border bg-white px-3 py-2 text-sm text-uc-text-light-default shadow-sm focus:border-uc-red-500 focus:outline-none focus:ring-2 focus:ring-uc-red-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-uc-text-dark-default dark:focus:border-uc-red-400 dark:focus:ring-uc-red-900/30"
                    >
                      <option value="">Select asset</option>
                      {assets.map((asset) => (
                        <option key={asset.id} value={asset.id}>
                          {asset.emoji} {asset.name} ({asset.type.toUpperCase()})
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                {selectedAsset && (
                  <div className="mt-2 rounded-lg bg-uc-light-subtle p-2 text-xs text-uc-text-light-muted dark:bg-neutral-700/50 dark:text-uc-text-dark-muted">
                    {selectedAsset.unitId && <span>Unit: {selectedAsset.unitId}</span>}
                    {selectedAsset.licensePlate && <span className="ml-2">• Plate: {selectedAsset.licensePlate}</span>}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4 ring-1 ring-uc-light-border dark:bg-neutral-800 dark:ring-neutral-700">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium">
            General notes
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="rounded-xl border border-uc-light-border bg-white px-3 py-2 text-sm text-uc-text-light-default shadow-sm focus:border-uc-red-500 focus:outline-none focus:ring-2 focus:ring-uc-red-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-uc-text-dark-default dark:focus:border-uc-red-400 dark:focus:ring-uc-red-900/30"
              placeholder="Anything else crews should know"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium">
            Hazards / access info
            <textarea
              value={hazard}
              onChange={(e) => setHazard(e.target.value)}
              rows={4}
              className="rounded-xl border border-uc-light-border bg-white px-3 py-2 text-sm text-uc-text-light-default shadow-sm focus:border-uc-red-500 focus:outline-none focus:ring-2 focus:ring-uc-red-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-uc-text-dark-default dark:focus:border-uc-red-400 dark:focus:ring-uc-red-900/30"
              placeholder="Construction, closures, or safety concerns"
            />
          </label>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {status && <p className="text-sm text-green-600 dark:text-green-400">{status}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center justify-center rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-400"
      >
        {submitting ? 'Submitting…' : 'Send update to content team'}
      </button>
    </form>
  )
}
