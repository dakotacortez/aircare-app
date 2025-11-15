'use client'

import React, { useEffect, useState } from 'react'
import { useField, useFormFields, Select, FieldLabel } from '@payloadcms/ui'

/**
 * Custom field component for selecting hospital capability levels
 * Dynamically loads levels based on the selected capability
 */
export const CapabilityLevelSelect: React.FC<any> = ({ path, field, admin }) => {
  const { value, setValue } = useField<string>({ path })
  const capability = useFormFields(([fields]) => fields.capability?.value)
  const [levels, setLevels] = useState<Array<{ label: string; value: string }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch levels when capability changes
  useEffect(() => {
    const fetchLevels = async () => {
      if (!capability) {
        setLevels([{ label: 'Please select a capability type first', value: '' }])
        return
      }

      setLoading(true)
      setError(null)

      try {
        // Get the capability ID
        const capabilityId = typeof capability === 'object' ? capability.id : capability

        // Fetch the capability to get its levels
        const response = await fetch(`/api/hospital-capabilities/${capabilityId}`, {
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error('Failed to fetch capability levels')
        }

        const capabilityData = await response.json()

        if (!capabilityData?.levels || capabilityData.levels.length === 0) {
          setLevels([
            {
              label: 'No levels defined - please add levels to this capability type first',
              value: '',
            },
          ])
        } else {
          // Map levels to options
          const options = capabilityData.levels.map((levelObj: { level: string }) => ({
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
      <FieldLabel field={field} />
      <Select
        value={value}
        onChange={(e: any) => setValue(e.value)}
        options={levels}
        disabled={loading || !capability}
      />
      {admin?.description && (
        <div className="field-description" style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
          {admin.description}
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
