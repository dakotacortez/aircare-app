import type { CollectionConfig } from 'payload'
import { anyone } from '../access/anyone'
import { isContentOrAdmin } from '../access/roles'

/**
 * Calculators Collection
 * 
 * Stores metadata about clinical calculators/tools available in the app.
 * The actual calculator logic is implemented as React components in the front end,
 * keyed by the 'key' field.
 * 
 * Calculators can be:
 * - Tagged by topic (e.g., "RSI", "Vent", "Peds", "Weight based")
 * - Associated with service lines (BLS, ALS, MICU, Flight, CCT, CommSpec)
 * - Auto-selected for protocols based on tags/service lines
 * - Overridden per-protocol for visibility and ordering
 */
export const Calculators: CollectionConfig = {
  slug: 'calculators',
  labels: {
    singular: 'Calculator',
    plural: 'Calculators',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'key', 'enabled', 'showByDefault'],
    group: 'Clinical Content',
    description: 'Clinical calculators and quick tools metadata',
  },
    access: {
      // Calculators must be visible to guests for landing/tools pages
      read: anyone,
    // Only content team or admin can create, update, delete
    create: isContentOrAdmin,
    update: isContentOrAdmin,
    delete: isContentOrAdmin,
  },
  hooks: {
    beforeChange: [
      async ({ req, operation, data }) => {
        // Set createdBy on create
        if (operation === 'create' && req.user) {
          data.createdBy = req.user.id
        }
        // Set updatedBy on update
        if (operation === 'update' && req.user) {
          data.updatedBy = req.user.id
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Calculator Title',
      admin: {
        placeholder: 'e.g., Weight-Based Dosing Calculator',
      },
    },
    {
      name: 'key',
      type: 'text',
      required: true,
      unique: true,
      label: 'Calculator Key',
      admin: {
        description: 'This must match a key in the front end calculator registry',
        placeholder: 'e.g., weightBasedDosing',
      },
      validate: (value: string | null | undefined) => {
        if (!value) return 'Calculator key is required'
        // Enforce camelCase or kebab-case for consistency
        if (!/^[a-z][a-zA-Z0-9-]*$/.test(value)) {
          return 'Calculator key must start with lowercase letter and contain only letters, numbers, and hyphens'
        }
        return true
      },
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Description',
      admin: {
        description: 'Brief description of what this calculator does',
        rows: 3,
      },
    },
    {
      name: 'category',
      type: 'select',
      label: 'Category',
      required: true,
      options: [
        { label: 'Neurological Assessment', value: 'neuro' },
        { label: 'Respiratory & Ventilation', value: 'respiratory' },
        { label: 'Cardiovascular & Hemodynamics', value: 'cardiovascular' },
        { label: 'Medications & Dosing', value: 'medications' },
        { label: 'Pediatric Tools', value: 'pediatric' },
        { label: 'Trauma & Burns', value: 'trauma' },
        { label: 'General', value: 'general' },
      ],
      admin: {
        description: 'Primary category for organizing calculators',
      },
    },
    {
      name: 'serviceLines',
      type: 'select',
      label: 'Service Lines',
      hasMany: true,
      options: [
        { label: 'BLS', value: 'BLS' },
        { label: 'ALS', value: 'ALS' },
        { label: 'MICU', value: 'MICU' },
        { label: 'Flight', value: 'Flight' },
        { label: 'CCT', value: 'CCT' },
        { label: 'CommSpec', value: 'CommSpec' },
      ],
      admin: {
        description: 'Which service lines this calculator applies to',
      },
    },
    {
      name: 'tags',
      type: 'array',
      label: 'Tags',
      admin: {
        description: 'Tags for matching calculators to protocols (e.g., "RSI", "Vent", "Peds", "Weight based")',
      },
      fields: [
        {
          name: 'tag',
          type: 'text',
          label: 'Tag',
          admin: {
            placeholder: 'e.g., RSI, Vent, Peds',
          },
        },
      ],
    },
    {
      name: 'defaultOrder',
      type: 'number',
      label: 'Default Order',
      admin: {
        description: 'Default ordering for quick tools (lower numbers appear first)',
        placeholder: '0',
      },
    },
    {
      name: 'enabled',
      type: 'checkbox',
      label: 'Enabled',
      defaultValue: true,
      admin: {
        description: 'Disable to hide calculator system-wide',
      },
    },
    {
      name: 'showByDefault',
      type: 'checkbox',
      label: 'Show by Default',
      defaultValue: true,
      admin: {
        description: 'Calculators can be hidden per protocol even if tags match',
      },
    },
    {
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
      label: 'Created By',
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'User who created this calculator',
      },
    },
    {
      name: 'updatedBy',
      type: 'relationship',
      relationTo: 'users',
      label: 'Last Updated By',
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'User who last updated this calculator',
      },
    },
  ],
  timestamps: true,
}
