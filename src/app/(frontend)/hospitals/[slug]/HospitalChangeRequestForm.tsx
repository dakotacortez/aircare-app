'use client'

import React, { useState } from 'react'
import type { Hospital, HospitalCapability } from '@/payload-types'

interface HospitalChangeRequestFormProps {
  hospital: Hospital
  capabilities: HospitalCapability[]
}

type PhoneEntry = {
  label: string
  phoneNumber: string
  description?: string
}

type DoorCodeEntry = {
  label: string
  code: string
  notes?: string
  isPrimary?: boolean
}

type CapabilityEntry = {
  capability: number | null
  level: string
  action: 'add' | 'change' | 'remove'
}

type RawPhone = NonNullable<Hospital['otherPhones']>[number]
type RawDoorCode = NonNullable<Hospital['doorCodes']>[number]

const normalizePhones = (otherPhones: Hospital['otherPhones']): PhoneEntry[] =>
  (otherPhones ?? [])
    .filter((phone): phone is RawPhone => Boolean(phone) && typeof phone === 'object')
    .map((phone) => ({
      label: phone.label ?? '',
      phoneNumber: phone.phoneNumber ?? '',
      description: phone.description ?? '',
    }))

const normalizeDoorCodes = (doorCodes: Hospital['doorCodes']): DoorCodeEntry[] =>
  (doorCodes ?? [])
    .filter((door): door is RawDoorCode => Boolean(door) && typeof door === 'object')
    .map((door) => ({
      label: door.label ?? '',
      code: door.code ?? '',
      notes: door.notes ?? '',
      isPrimary: door.isPrimary ?? false,
    }))

const cleanString = (value: string) => value.trim() || undefined

export function HospitalChangeRequestForm({ hospital, capabilities }: HospitalChangeRequestFormProps) {
  const [name, setName] = useState(hospital.name ?? '')
  const [addressLine1, setAddressLine1] = useState(hospital.address?.line1 ?? '')
  const [addressLine2, setAddressLine2] = useState(hospital.address?.line2 ?? '')
  const [city, setCity] = useState(hospital.address?.city ?? '')
  const [state, setState] = useState(hospital.address?.state ?? '')
  const [zip, setZip] = useState(hospital.address?.zip ?? '')
  const [squadPhone, setSquadPhone] = useState(hospital.squadPhone ?? '')
  const [notes, setNotes] = useState('')
  const [hazard, setHazard] = useState('')
  const [otherPhones, setOtherPhones] = useState<PhoneEntry[]>(normalizePhones(hospital.otherPhones))
  const [doorCodes, setDoorCodes] = useState<DoorCodeEntry[]>(normalizeDoorCodes(hospital.doorCodes))
  const [capabilityChanges, setCapabilityChanges] = useState<CapabilityEntry[]>([])

  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const addPhoneRow = () => {
    setOtherPhones((rows) => [...rows, { label: '', phoneNumber: '', description: '' }])
  }

  const updatePhoneRow = (index: number, field: keyof PhoneEntry, value: string) => {
    setOtherPhones((rows) => rows.map((row, idx) => (idx === index ? { ...row, [field]: value } : row)))
  }

  const removePhoneRow = (index: number) => {
    setOtherPhones((rows) => rows.filter((_, idx) => idx !== index))
  }

  const addDoorCodeRow = () => {
    setDoorCodes((rows) => [...rows, { label: '', code: '', notes: '', isPrimary: false }])
  }

  const updateDoorCodeRow = (index: number, field: keyof DoorCodeEntry, value: string | boolean) => {
    setDoorCodes((rows) => rows.map((row, idx) => (idx === index ? { ...row, [field]: value } : row)))
  }

  const removeDoorCodeRow = (index: number) => {
    setDoorCodes((rows) => rows.filter((_, idx) => idx !== index))
  }

  const addCapabilityChange = () => {
    setCapabilityChanges((rows) => [...rows, { capability: null, level: '', action: 'add' }])
  }

  const updateCapabilityChange = (index: number, field: keyof CapabilityEntry, value: any) => {
    setCapabilityChanges((rows) => rows.map((row, idx) => (idx === index ? { ...row, [field]: value } : row)))
  }

  const removeCapabilityChange = (index: number) => {
    setCapabilityChanges((rows) => rows.filter((_, idx) => idx !== index))
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

    const filteredPhones = otherPhones
      .map((phone) => ({
        label: cleanString(phone.label),
        phoneNumber: cleanString(phone.phoneNumber),
        description: cleanString(phone.description ?? ''),
      }))
      .filter((phone) => phone.label || phone.phoneNumber || phone.description)

    const filteredDoorCodes = doorCodes
      .map((door) => ({
        label: cleanString(door.label),
        code: cleanString(door.code),
        notes: cleanString(door.notes ?? ''),
        isPrimary: door.isPrimary ?? false,
      }))
      .filter((door) => door.label || door.code || door.notes)

    const filteredCapabilities = capabilityChanges
      .filter((cap) => cap.capability !== null)
      .map((cap) => ({
        capability: cap.capability,
        level: cleanString(cap.level),
        action: cap.action,
      }))

    const proposedData: Record<string, unknown> = {}

    const nameValue = cleanString(name)
    if (nameValue) proposedData.name = nameValue
    if (Object.keys(addressPayload).length > 0) proposedData.address = addressPayload

    const squadPhoneValue = cleanString(squadPhone)
    if (squadPhoneValue) proposedData.squadPhone = squadPhoneValue
    if (filteredPhones.length > 0) proposedData.otherPhones = filteredPhones
    if (filteredDoorCodes.length > 0) proposedData.doorCodes = filteredDoorCodes
    if (filteredCapabilities.length > 0) proposedData.capabilities = filteredCapabilities

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

      const response = await fetch('/api/hospital-change-requests', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'update',
          targetHospital: hospital.id,
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
        <h2 className="mb-3 text-base font-semibold">Which details need an update?</h2>
        <p className="mb-4 text-sm text-uc-text-light-muted dark:text-uc-text-dark-muted">
          Share the fields you know are out of date. Leave anything blank if it doesn&apos;t need to change.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium">
            Hospital name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl border border-uc-light-border bg-white px-3 py-2 text-sm text-uc-text-light-default shadow-sm focus:border-uc-red-500 focus:outline-none focus:ring-2 focus:ring-uc-red-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-uc-text-dark-default dark:focus:border-uc-red-400 dark:focus:ring-uc-red-900/30"
              placeholder="e.g., UC Medical Center"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium">
            Squad phone
            <input
              type="tel"
              value={squadPhone}
              onChange={(e) => setSquadPhone(e.target.value)}
              className="rounded-xl border border-uc-light-border bg-white px-3 py-2 text-sm text-uc-text-light-default shadow-sm focus:border-uc-red-500 focus:outline-none focus:ring-2 focus:ring-uc-red-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-uc-text-dark-default dark:focus:border-uc-red-400 dark:focus:ring-uc-red-900/30"
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
              className="rounded-xl border border-uc-light-border bg-white px-3 py-2 text-sm text-uc-text-light-default shadow-sm focus:border-uc-red-500 focus:outline-none focus:ring-2 focus:ring-uc-red-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-uc-text-dark-default dark:focus:border-uc-red-400 dark:focus:ring-uc-red-900/30"
              placeholder="123 Main St"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium">
            Address line 2
            <input
              type="text"
              value={addressLine2}
              onChange={(e) => setAddressLine2(e.target.value)}
              className="rounded-xl border border-uc-light-border bg-white px-3 py-2 text-sm text-uc-text-light-default shadow-sm focus:border-uc-red-500 focus:outline-none focus:ring-2 focus:ring-uc-red-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-uc-text-dark-default dark:focus:border-uc-red-400 dark:focus:ring-uc-red-900/30"
              placeholder="Suite / Floor"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium">
            City
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="rounded-xl border border-uc-light-border bg-white px-3 py-2 text-sm text-uc-text-light-default shadow-sm focus:border-uc-red-500 focus:outline-none focus:ring-2 focus:ring-uc-red-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-uc-text-dark-default dark:focus:border-uc-red-400 dark:focus:ring-uc-red-900/30"
              placeholder="Cincinnati"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-2 text-sm font-medium">
              State
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="rounded-xl border border-uc-light-border bg-white px-3 py-2 text-sm text-uc-text-light-default shadow-sm focus:border-uc-red-500 focus:outline-none focus:ring-2 focus:ring-uc-red-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-uc-text-dark-default dark:focus:border-uc-red-400 dark:focus:ring-uc-red-900/30"
                placeholder="OH"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium">
              ZIP
              <input
                type="text"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                className="rounded-xl border border-uc-light-border bg-white px-3 py-2 text-sm text-uc-text-light-default shadow-sm focus:border-uc-red-500 focus:outline-none focus:ring-2 focus:ring-uc-red-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-uc-text-dark-default dark:focus:border-uc-red-400 dark:focus:ring-uc-red-900/30"
                placeholder="45219"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4 ring-1 ring-uc-light-border dark:bg-neutral-800 dark:ring-neutral-700">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold">Additional contacts</h3>
            <p className="text-sm text-uc-text-light-muted dark:text-uc-text-dark-muted">
              Add charge nurse, security, or other direct lines.
            </p>
          </div>
          <button
            type="button"
            onClick={addPhoneRow}
            className="rounded-full bg-uc-light-subtle px-3 py-1 text-sm font-medium text-uc-text-light-default ring-1 ring-uc-light-border transition hover:bg-uc-light-card dark:bg-neutral-700 dark:text-uc-text-dark-default dark:ring-neutral-600"
          >
            + Add contact
          </button>
        </div>

        {otherPhones.length === 0 && (
          <p className="text-sm text-uc-text-light-muted dark:text-uc-text-dark-muted">
            No extra contacts added yet.
          </p>
        )}

        <div className="space-y-3">
          {otherPhones.map((phone, index) => (
            <div key={index} className="rounded-xl border border-uc-light-border p-3 dark:border-neutral-700">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-medium">Contact {index + 1}</p>
                <button
                  type="button"
                  onClick={() => removePhoneRow(index)}
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
                    value={phone.label}
                    onChange={(e) => updatePhoneRow(index, 'label', e.target.value)}
                    className="rounded-xl border border-uc-light-border bg-white px-3 py-2 text-sm text-uc-text-light-default shadow-sm focus:border-uc-red-500 focus:outline-none focus:ring-2 focus:ring-uc-red-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-uc-text-dark-default dark:focus:border-uc-red-400 dark:focus:ring-uc-red-900/30"
                    placeholder="Charge nurse"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium">
                  Phone number
                  <input
                    type="tel"
                    value={phone.phoneNumber}
                    onChange={(e) => updatePhoneRow(index, 'phoneNumber', e.target.value)}
                    className="rounded-xl border border-uc-light-border bg-white px-3 py-2 text-sm text-uc-text-light-default shadow-sm focus:border-uc-red-500 focus:outline-none focus:ring-2 focus:ring-uc-red-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-uc-text-dark-default dark:focus:border-uc-red-400 dark:focus:ring-uc-red-900/30"
                    placeholder="(734) 555-5678"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium">
                  Notes
                  <input
                    type="text"
                    value={phone.description}
                    onChange={(e) => updatePhoneRow(index, 'description', e.target.value)}
                    className="rounded-xl border border-uc-light-border bg-white px-3 py-2 text-sm text-uc-text-light-default shadow-sm focus:border-uc-red-500 focus:outline-none focus:ring-2 focus:ring-uc-red-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-uc-text-dark-default dark:focus:border-uc-red-400 dark:focus:ring-uc-red-900/30"
                    placeholder="Best times or directions"
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
            <p className="text-sm text-uc-text-light-muted dark:text-uc-text-dark-muted">
              ED entrance codes and access details.
            </p>
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
          <p className="text-sm text-uc-text-light-muted dark:text-uc-text-dark-muted">
            No door codes to update yet.
          </p>
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
                    className="rounded-xl border border-uc-light-border bg-white px-3 py-2 text-sm text-uc-text-light-default shadow-sm focus:border-uc-red-500 focus:outline-none focus:ring-2 focus:ring-uc-red-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-uc-text-dark-default dark:focus:border-uc-red-400 dark:focus:ring-uc-red-900/30"
                    placeholder="ED entrance"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium">
                  Code
                  <input
                    type="text"
                    value={door.code}
                    onChange={(e) => updateDoorCodeRow(index, 'code', e.target.value)}
                    className="rounded-xl border border-uc-light-border bg-white px-3 py-2 text-sm text-uc-text-light-default shadow-sm focus:border-uc-red-500 focus:outline-none focus:ring-2 focus:ring-uc-red-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-uc-text-dark-default dark:focus:border-uc-red-400 dark:focus:ring-uc-red-900/30"
                    placeholder="1234#"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium">
                  Notes
                  <input
                    type="text"
                    value={door.notes}
                    onChange={(e) => updateDoorCodeRow(index, 'notes', e.target.value)}
                    className="rounded-xl border border-uc-light-border bg-white px-3 py-2 text-sm text-uc-text-light-default shadow-sm focus:border-uc-red-500 focus:outline-none focus:ring-2 focus:ring-uc-red-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-uc-text-dark-default dark:focus:border-uc-red-400 dark:focus:ring-uc-red-900/30"
                    placeholder="After hours only"
                  />
                </label>
              </div>
              <div className="mt-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={door.isPrimary ?? false}
                    onChange={(e) => updateDoorCodeRow(index, 'isPrimary', e.target.checked)}
                    className="h-4 w-4 rounded border-uc-light-border text-uc-red-600 focus:ring-2 focus:ring-uc-red-200 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:ring-uc-red-900/30"
                  />
                  <span className="font-medium text-uc-text-light-default dark:text-uc-text-dark-default">
                    Mark as primary door code
                  </span>
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4 ring-1 ring-uc-light-border dark:bg-neutral-800 dark:ring-neutral-700">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold">Clinical capabilities</h3>
            <p className="text-sm text-uc-text-light-muted dark:text-uc-text-dark-muted">
              Add, change, or remove capability certifications.
            </p>
          </div>
          <button
            type="button"
            onClick={addCapabilityChange}
            className="rounded-full bg-uc-light-subtle px-3 py-1 text-sm font-medium text-uc-text-light-default ring-1 ring-uc-light-border transition hover:bg-uc-light-card dark:bg-neutral-700 dark:text-uc-text-dark-default dark:ring-neutral-600"
          >
            + Add capability
          </button>
        </div>

        {capabilityChanges.length === 0 && (
          <p className="text-sm text-uc-text-light-muted dark:text-uc-text-dark-muted">
            No capability changes yet.
          </p>
        )}

        <div className="space-y-3">
          {capabilityChanges.map((cap, index) => {
            const selectedCapability = capabilities.find((c) => c.id === cap.capability)
            const levelOptions = selectedCapability?.levels ?? []

            return (
              <div key={index} className="rounded-xl border border-uc-light-border p-3 dark:border-neutral-700">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">Capability {index + 1}</p>
                  <button
                    type="button"
                    onClick={() => removeCapabilityChange(index)}
                    className="text-xs text-uc-text-light-muted underline decoration-dashed underline-offset-4 transition hover:text-uc-text-light-default dark:text-uc-text-dark-muted dark:hover:text-uc-text-dark-default"
                  >
                    Remove
                  </button>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <label className="flex flex-col gap-2 text-sm font-medium">
                    Action
                    <select
                      value={cap.action}
                      onChange={(e) => updateCapabilityChange(index, 'action', e.target.value)}
                      className="rounded-xl border border-uc-light-border bg-white px-3 py-2 text-sm text-uc-text-light-default shadow-sm focus:border-uc-red-500 focus:outline-none focus:ring-2 focus:ring-uc-red-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-uc-text-dark-default dark:focus:border-uc-red-400 dark:focus:ring-uc-red-900/30"
                    >
                      <option value="add">Add</option>
                      <option value="change">Change</option>
                      <option value="remove">Remove</option>
                    </select>
                  </label>
                  <label className="flex flex-col gap-2 text-sm font-medium">
                    Capability type
                    <select
                      value={cap.capability ?? ''}
                      onChange={(e) => updateCapabilityChange(index, 'capability', Number(e.target.value) || null)}
                      className="rounded-xl border border-uc-light-border bg-white px-3 py-2 text-sm text-uc-text-light-default shadow-sm focus:border-uc-red-500 focus:outline-none focus:ring-2 focus:ring-uc-red-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-uc-text-dark-default dark:focus:border-uc-red-400 dark:focus:ring-uc-red-900/30"
                    >
                      <option value="">Select capability</option>
                      {capabilities.map((capability) => (
                        <option key={capability.id} value={capability.id}>
                          {capability.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-2 text-sm font-medium">
                    Level
                    <select
                      value={cap.level}
                      onChange={(e) => updateCapabilityChange(index, 'level', e.target.value)}
                      disabled={!selectedCapability}
                      className="rounded-xl border border-uc-light-border bg-white px-3 py-2 text-sm text-uc-text-light-default shadow-sm focus:border-uc-red-500 focus:outline-none focus:ring-2 focus:ring-uc-red-200 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-uc-text-dark-default dark:focus:border-uc-red-400 dark:focus:ring-uc-red-900/30"
                    >
                      <option value="">Select level</option>
                      {levelOptions.map((levelOption, idx) => (
                        <option key={idx} value={levelOption.level}>
                          {levelOption.level}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4 ring-1 ring-uc-light-border dark:bg-neutral-800 dark:ring-neutral-700">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium">
            Critical notes
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="rounded-xl border border-uc-light-border bg-white px-3 py-2 text-sm text-uc-text-light-default shadow-sm focus:border-uc-red-500 focus:outline-none focus:ring-2 focus:ring-uc-red-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-uc-text-dark-default dark:focus:border-uc-red-400 dark:focus:ring-uc-red-900/30"
              placeholder="Important staffing, specialty, or transfer notes"
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
