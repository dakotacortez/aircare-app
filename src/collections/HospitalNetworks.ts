import type { CollectionConfig } from 'payload'
import { isLoggedIn, isContentOrAdmin } from '../access/roles'

/**
 * Hospital Networks Collection
 * Represents hospital systems/networks (e.g., Trinity Health, Ascension)
 * Used to group hospitals and provide default logos
 */
export const HospitalNetworks: CollectionConfig = {
  slug: 'hospital-networks',
  labels: {
    singular: 'Hospital Network',
    plural: 'Hospital Networks',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name'],
    group: 'Hospitals',
    description: 'Hospital systems and networks',
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
      label: 'Network Name',
      admin: {
        placeholder: 'e.g., Trinity Health, Ascension',
      },
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      label: 'Network Logo',
      admin: {
        description: 'Default logo for hospitals in this network',
      },
    },
  ],
  timestamps: true,
}
