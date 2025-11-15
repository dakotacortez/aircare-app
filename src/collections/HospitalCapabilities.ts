import type { CollectionConfig } from 'payload'
import { isLoggedIn, isContentOrAdmin } from '../access/roles'

/**
 * Hospital Capabilities Collection
 * Defines specific clinical capabilities hospitals may have
 * (e.g., Trauma Level I, PCI capability, Stroke center designation)
 */
export const HospitalCapabilities: CollectionConfig = {
  slug: 'hospital-capabilities',
  labels: {
    singular: 'Hospital Capability',
    plural: 'Hospital Capabilities',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'category'],
    group: 'Hospitals',
    description: 'Clinical capabilities and certifications for hospitals',
  },
  access: {
    // Any logged in user can read
    read: isLoggedIn,
    // Only content team or admin can create, update, delete
    create: isContentOrAdmin,
    update: isContentOrAdmin,
    delete: isContentOrAdmin,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Capability Name',
      admin: {
        placeholder: 'e.g., Trauma, PCI, Stroke, OB',
      },
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [
        { label: 'Trauma', value: 'trauma' },
        { label: 'Cardiac', value: 'cardiac' },
        { label: 'Neuro', value: 'neuro' },
        { label: 'Obstetrics', value: 'obstetrics' },
        { label: 'Other', value: 'other' },
      ],
      admin: {
        description: 'Category for organizing capabilities',
      },
    },
    {
      name: 'levels',
      type: 'array',
      label: 'Available Levels',
      admin: {
        description: 'Possible levels for this capability (e.g., "Level I", "Level II", "Level III")',
      },
      fields: [
        {
          name: 'level',
          type: 'text',
          required: true,
          admin: {
            placeholder: 'e.g., Level I, Level II, Primary',
          },
        },
      ],
    },
  ],
  timestamps: true,
}
