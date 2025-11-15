import type { CollectionConfig } from 'payload'
import { isLoggedIn, isContentOrAdmin } from '../access/roles'

/**
 * Hospital Capabilities Collection
 * Defines clinical capability types and their available certification levels
 *
 * Examples:
 * - Trauma (Levels: I, II, III, IV)
 * - PCI (Levels: Level 1 Diagnostic Only, Level 2 Moderate Risk, Level 3 Open Heart Backup)
 * - Maternity/L&D (Levels: I Basic/Low Risk, II Specialty Service, III Onsite PICU, IV Regional Highest ICU)
 */
export const HospitalCapabilities: CollectionConfig = {
  slug: 'hospital-capabilities',
  labels: {
    singular: 'Capability Type',
    plural: 'Capability Types',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'category'],
    group: 'Hospitals',
    description: 'Define capability types and their certification levels (e.g., Trauma with levels I-IV)',
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
        description: 'The name of this capability type',
        placeholder: 'e.g., Trauma Center, PCI, Stroke Center, Maternity',
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
        description: 'Category for organizing and filtering capabilities',
      },
    },
    {
      name: 'levels',
      type: 'array',
      label: 'Certification Levels',
      required: true,
      admin: {
        description: 'Define all possible certification levels for this capability. These levels will appear as options when assigning this capability to hospitals.',
      },
      fields: [
        {
          name: 'level',
          type: 'text',
          required: true,
          label: 'Level Name',
          admin: {
            description: 'Enter the level name exactly as it should appear (e.g., "Level I", "Level 2 - Moderate Risk")',
            placeholder: 'e.g., Level I, Level 2 - Moderate Risk, I - Basic/Low Risk',
          },
        },
      ],
    },
  ],
  timestamps: true,
}
