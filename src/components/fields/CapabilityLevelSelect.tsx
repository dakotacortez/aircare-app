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
}

const CapabilityLevelSelect: React.FC<any> = ({ path, field }) => {
  const { value: selectedLevel, setValue: setSelectedLevel } = useField<string>({ path })
  const capabilityPath = useMemo(() => path.replace(/\.level$/, '.capability'), [path])
  const { value: capabilityValue } = useField<unknown>({ path: capabilityPath })
  const [levels, setLevels] = useState<LevelOption[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const selectedLevelRef = useRef(selectedLevel)

  useEffect(() => {
    selectedLevelRef.current = selectedLevel
  }, [selectedLevel])

  const capabilityId = useMemo(() => {
    if (!capabilityValue) return null

    if (typeof capabilityValue === 'object') {
      if ('value' in (capabilityValue as Record<string, unknown>) && (capabilityValue as any).value) {
        const nestedValue = (capabilityValue as any).value
        if (typeof nestedValue === 'object' && nestedValue?.id) {
          return nestedValue.id
        }
        return nestedValue
      }

      if ('id' in (capabilityValue as Record<string, unknown>)) {
        return (capabilityValue as any).id
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
          const options: LevelOption[] = capabilityData.levels.map((levelObj: { level: string }) => ({
            label: levelObj.level,
            value: levelObj.level,
          }))
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
        value={levels.find((option) => option.value === selectedLevel) ?? undefined}
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
      {field?.admin?.description && (
        <div className="field-description" style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
          {field.admin.description}
        </div>
      )}
      {error && (
        <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#ef4444' }}>
          {error}
        </div>
      )}
    </div>
  )
}

export { CapabilityLevelSelect }
export default CapabilityLevelSelect
