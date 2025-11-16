'use client'

import React, { useEffect, useState } from 'react'
import { useField, useFormFields, Select, FieldLabel } from '@payloadcms/ui'

/**
 * Custom field component for selecting hospital capability levels
 * Dynamically loads levels based on the selected capability
 */
type CapabilityFormValue =
  | { id?: string | number }
  | string
  | number
  | null
  | undefined

type SelectOption = {
  label: string
  value: string
}

type CapabilityLevelSelectProps = {
  path: string
  field?: {
    label?: string
    required?: boolean
    admin?: {
      description?: string
    }
  }
}

type CapabilityResponse = {
  levels?: { level: string }[]
}

const RESOLVED_CAPABILITY_PLACEHOLDER = {
  label: 'Please select a capability type first',
  value: '',
}

export const CapabilityLevelSelect: React.FC<CapabilityLevelSelectProps> = ({ path, field }) => {
  const { value, setValue } = useField<string>({ path })
  const capability = useFormFields(
    ([fields]) => fields.capability?.value as CapabilityFormValue | undefined,
  )
  const [levels, setLevels] = useState<SelectOption[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resolveCapabilityId = (capabilityValue: CapabilityFormValue): string | number | null => {
    if (typeof capabilityValue === 'object' && capabilityValue !== null) {
      return capabilityValue.id ?? null
    }

    if (capabilityValue === undefined || capabilityValue === null) {
      return null
    }

    return capabilityValue
  }

  // Fetch levels when capability changes
  useEffect(() => {
    const fetchLevels = async () => {
      if (!capability) {
        setLevels([RESOLVED_CAPABILITY_PLACEHOLDER])
        return
      }

      const capabilityId = resolveCapabilityId(capability)
      if (!capabilityId) {
        setLevels([RESOLVED_CAPABILITY_PLACEHOLDER])
        return
      }

      setLoading(true)
      setError(null)

      try {
        // Fetch the capability to get its levels
        const response = await fetch(`/api/hospital-capabilities/${capabilityId}`, {
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error('Failed to fetch capability levels')
        }

        const capabilityData = (await response.json()) as CapabilityResponse

        if (!capabilityData?.levels || capabilityData.levels.length === 0) {
          setLevels([
            {
              label: 'No levels defined - please add levels to this capability type first',
              value: '',
            },
          ])
        } else {
          // Map levels to options
          const options = capabilityData.levels.map((levelObj) => ({
            label: levelObj.level,
            value: levelObj.level,
          }))
          setLevels(options)
        }
      } catch (err) {
        console.error('Error fetching capability levels:', err)
        setError('Error loading levels')
        setLevels([{ label: 'Error loading levels - please try again', value: '' }])
      } finally {
        setLoading(false)
      }
    }

    fetchLevels()
  }, [capability])

  return (
    <div className="field-type text">
      <FieldLabel label={field?.label} required={field?.required} />
      <Select
        value={levels.find((option) => option.value === value)}
        onChange={(selected: SelectOption | null) => setValue(selected?.value ?? '')}
        options={levels}
        disabled={loading || !capability}
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
