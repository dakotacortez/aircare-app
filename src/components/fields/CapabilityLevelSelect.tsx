'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useField, FieldLabel } from '@payloadcms/ui'

/**
 * Custom field component for selecting hospital capability levels
 * Dynamically loads levels based on the selected capability
 */
type LevelOption = {
  label: string
  value: string
  description?: string
}

interface CapabilityLevelSelectProps {
  path: string
  field?: {
    label?: string
    required?: boolean
    admin?: {
      description?: string
    }
  }
}

const CapabilityLevelSelect: React.FC<CapabilityLevelSelectProps> = ({ path, field }) => {
  const { value: selectedLevel, setValue: setSelectedLevel } = useField<string>({ path })
  const capabilityPath = useMemo(() => {
    const computed = path.replace(/\.level$/, '.capability')
    console.log('[CapabilityLevelSelect] Field path:', path, '-> Capability path:', computed)
    return computed
  }, [path])
  const { value: capabilityValue } = useField<unknown>({ path: capabilityPath })
  const [levels, setLevels] = useState<LevelOption[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [capabilityMeta, setCapabilityMeta] = useState<{ name?: string; category?: string } | null>(null)
  const selectedLevelRef = useRef(selectedLevel)
  const selectedOption = useMemo(
    () => levels.find((option) => option.value === selectedLevel),
    [levels, selectedLevel],
  )

  useEffect(() => {
    selectedLevelRef.current = selectedLevel
  }, [selectedLevel])

  const capabilityId = useMemo(() => {
    console.log('[CapabilityLevelSelect] Raw capabilityValue:', capabilityValue)

    if (!capabilityValue) {
      console.log('[CapabilityLevelSelect] No capability value')
      return null
    }

    // If it's a string, use it directly as the ID
    if (typeof capabilityValue === 'string') {
      console.log('[CapabilityLevelSelect] Capability ID (string):', capabilityValue)
      return capabilityValue
    }

    if (typeof capabilityValue === 'object') {
      const objValue = capabilityValue as Record<string, unknown>

      // Handle case: { value: { id: 'xxx' } }
      if ('value' in objValue && objValue.value) {
        const nestedValue = objValue.value
        if (typeof nestedValue === 'object' && nestedValue && 'id' in nestedValue) {
          const extractedId = (nestedValue as Record<string, unknown>).id
          console.log('[CapabilityLevelSelect] Capability ID (nested object with id):', extractedId)
          return extractedId
        }
        // Handle case: { value: 'xxx' }
        if (typeof nestedValue === 'string') {
          console.log('[CapabilityLevelSelect] Capability ID (nested string):', nestedValue)
          return nestedValue
        }
      }

      // Handle case: { id: 'xxx' }
      if ('id' in objValue) {
        console.log('[CapabilityLevelSelect] Capability ID (direct id):', objValue.id)
        return objValue.id
      }

      // Handle case: { relationTo: 'hospital-capabilities', value: 'xxx' }
      if ('relationTo' in objValue && 'value' in objValue) {
        const relValue = objValue.value
        if (typeof relValue === 'string') {
          console.log('[CapabilityLevelSelect] Capability ID (relationTo with string value):', relValue)
          return relValue
        }
        if (typeof relValue === 'object' && relValue && 'id' in (relValue as Record<string, unknown>)) {
          const extractedId = (relValue as Record<string, unknown>).id
          console.log('[CapabilityLevelSelect] Capability ID (relationTo with object value):', extractedId)
          return extractedId
        }
      }
    }

    console.log('[CapabilityLevelSelect] Could not extract capability ID, returning raw value:', capabilityValue)
    return capabilityValue
  }, [capabilityValue])

  // Fetch levels when capability changes
  useEffect(() => {
    let isMounted = true

    const clearSelectedLevel = () => {
      if (selectedLevelRef.current) {
        setSelectedLevel('')
      }
    }

    const fetchLevels = async () => {
      if (!capabilityId) {
        console.log('[CapabilityLevelSelect] No capability ID, clearing levels')
        if (isMounted) {
          setLevels([])
          setError(null)
          setLoading(false)
          setCapabilityMeta(null)
          clearSelectedLevel()
        }
        return
      }

      console.log('[CapabilityLevelSelect] Fetching levels for capability ID:', capabilityId)

      if (isMounted) {
        setLoading(true)
        setError(null)
      }

      try {
        // Fetch the capability to get its levels
        const apiUrl = `/api/hospital-capabilities/${capabilityId}`
        console.log('[CapabilityLevelSelect] Fetching from:', apiUrl)
        const response = await fetch(apiUrl, {
          credentials: 'include',
        })

        console.log('[CapabilityLevelSelect] Response status:', response.status)

        if (!response.ok) {
          throw new Error(`Failed to fetch capability levels: ${response.status} ${response.statusText}`)
        }

        // The Payload REST API wraps documents in a `doc` key, but
        // fall back to the root in case the structure changes.
        const capabilityData = await response.json()
        console.log('[CapabilityLevelSelect] Capability data:', capabilityData)

        const capabilityDoc = capabilityData?.doc ?? capabilityData
        const capabilityLevels = capabilityDoc?.levels ?? []
        console.log('[CapabilityLevelSelect] Capability levels:', capabilityLevels)

        setCapabilityMeta(
          capabilityDoc ? { name: capabilityDoc.name as string | undefined, category: capabilityDoc.category } : null,
        )

        if (!isMounted) return

        if (capabilityLevels.length === 0) {
          console.log('[CapabilityLevelSelect] No levels found for this capability')
          setLevels([])
          clearSelectedLevel()
        } else {
          // Map levels to options
          const options: LevelOption[] = capabilityLevels.map(
            (levelObj: { level: string; description?: string | null }) => ({
              label: levelObj.level,
              value: levelObj.level,
              description: levelObj.description ?? undefined,
            }),
          )
          console.log('[CapabilityLevelSelect] Mapped level options:', options)
          setLevels(options)

          const currentLevel = selectedLevelRef.current
          if (currentLevel && !options.some((option) => option.value === currentLevel)) {
            console.log('[CapabilityLevelSelect] Current level not in options, clearing')
            setSelectedLevel('')
          }
        }
      } catch (err) {
        console.error('[CapabilityLevelSelect] Error fetching capability levels:', err)
        if (isMounted) {
          setError('Error loading levels')
          setLevels([])
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchLevels()
    return () => {
      isMounted = false
    }
  }, [capabilityId, setSelectedLevel])

  return (
    <div className="field-type text">
      <FieldLabel label={field?.label} required={field?.required} />
      {capabilityMeta?.name && (
        <div className="field-description" style={{ marginBottom: '0.25rem', color: '#4b5563' }}>
          Levels for <strong>{capabilityMeta.name}</strong>
          {capabilityMeta.category ? ` (${capabilityMeta.category})` : ''}
        </div>
      )}
      <div style={{ position: 'relative' }}>
        <select
          value={selectedLevel || ''}
          onChange={(e) => setSelectedLevel(e.target.value)}
          disabled={loading || !capabilityId || levels.length === 0}
          style={{
            width: '100%',
            padding: '8px 12px',
            fontSize: '14px',
            lineHeight: '1.5',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            backgroundColor: loading || !capabilityId ? '#f9fafb' : '#ffffff',
            cursor: loading || !capabilityId ? 'not-allowed' : 'pointer',
            appearance: 'none',
            paddingRight: '32px',
          }}
        >
          <option value="">
            {loading
              ? 'Loading levels...'
              : !capabilityId
                ? 'Select a capability first'
                : levels.length === 0
                  ? 'No levels available'
                  : 'Select a level'}
          </option>
          {levels.map((level) => (
            <option key={level.value} value={level.value}>
              {level.label}
            </option>
          ))}
        </select>
        {/* Custom dropdown arrow */}
        <div
          style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            color: '#6b7280',
          }}
        >
          <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
            <path
              d="M1 1.5L6 6.5L11 1.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
      {selectedOption?.description && (
        <div
          className="field-description"
          style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#374151' }}
        >
          <strong>Level description:</strong> {selectedOption.description}
        </div>
      )}
      {!loading && !!capabilityId && levels.length === 0 && !error && (
        <div className="field-description" style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
          No certification levels are configured for this capability. Add levels in the Capability Types collection to make
          them available here.
        </div>
      )}
      {field?.admin?.description && (
        <div
          className="field-description"
          style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}
        >
          {field.admin.description}
        </div>
      )}
      {error && (
        <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#ef4444' }}>{error}</div>
      )}
    </div>
  )
}

export { CapabilityLevelSelect }
export default CapabilityLevelSelect
