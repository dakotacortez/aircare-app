'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useField, Select, FieldLabel } from '@payloadcms/ui'

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
  const capabilityPath = useMemo(() => path.replace(/\.level$/, '.capability'), [path])
  const { value: capabilityValue } = useField<unknown>({ path: capabilityPath })
  const [levels, setLevels] = useState<LevelOption[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const selectedLevelRef = useRef(selectedLevel)
  const selectedOption = useMemo(
    () => levels.find((option) => option.value === selectedLevel),
    [levels, selectedLevel],
  )

  useEffect(() => {
    selectedLevelRef.current = selectedLevel
  }, [selectedLevel])

  const capabilityId = useMemo(() => {
    if (!capabilityValue) return null

    if (typeof capabilityValue === 'object') {
      const objValue = capabilityValue as Record<string, unknown>
      if ('value' in objValue && objValue.value) {
        const nestedValue = objValue.value
        if (typeof nestedValue === 'object' && nestedValue && 'id' in nestedValue) {
          return (nestedValue as Record<string, unknown>).id
        }
        return nestedValue
      }

      if ('id' in objValue) {
        return objValue.id
      }
    }

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
        if (isMounted) {
          setLevels([])
          setError(null)
          setLoading(false)
          clearSelectedLevel()
        }
        return
      }

      if (isMounted) {
        setLoading(true)
        setError(null)
      }

      try {
        // Fetch the capability to get its levels
        const response = await fetch(`/api/hospital-capabilities/${capabilityId}`, {
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error('Failed to fetch capability levels')
        }

        const capabilityData = await response.json()

        if (!isMounted) return

        if (!capabilityData?.levels || capabilityData.levels.length === 0) {
          setLevels([])
          clearSelectedLevel()
        } else {
          // Map levels to options
          const options: LevelOption[] = capabilityData.levels.map(
            (levelObj: { level: string; description?: string | null }) => ({
              label: levelObj.level,
              value: levelObj.level,
              description: levelObj.description ?? undefined,
            }),
          )
          setLevels(options)

          const currentLevel = selectedLevelRef.current
          if (currentLevel && !options.some((option) => option.value === currentLevel)) {
            setSelectedLevel('')
          }
        }
      } catch (err) {
        console.error('Error fetching capability levels:', err)
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
      <Select
        value={selectedOption ?? undefined}
        onChange={(option) => {
          if (option && !Array.isArray(option) && 'value' in option) {
            setSelectedLevel(String(option.value) || '')
          } else {
            setSelectedLevel('')
          }
        }}
        options={levels}
        disabled={loading || !capabilityId}
      />
      {selectedOption?.description && (
        <div
          className="field-description"
          style={{ marginTop: '0.35rem', fontSize: '0.875rem', color: '#374151' }}
        >
          {selectedOption.description}
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
