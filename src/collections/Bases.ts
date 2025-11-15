import type { CollectionConfig } from 'payload'
import { isLoggedIn, isContentOrAdmin } from '../access/roles'

/**
 * Bases Collection
 * EMS base locations where units are stationed
 * Includes contact information, door codes, and assets
 */
export const Bases: CollectionConfig = {
  slug: 'bases',
  labels: {
    singular: 'Base',
    plural: 'Bases',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'address.city'],
    group: 'Operations',
    description: 'EMS base locations and station information',
  },
  access: {
    // Only logged in users can read (no guests)
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
      label: 'Base Name',
      admin: {
        placeholder: 'e.g., Station 1, Headquarters',
      },
    },
    {
      name: 'address',
      type: 'group',
      label: 'Address',
      fields: [
        {
          name: 'line1',
          type: 'text',
          label: 'Address Line 1',
        },
        {
          name: 'line2',
          type: 'text',
          label: 'Address Line 2',
        },
        {
          name: 'city',
          type: 'text',
          label: 'City',
        },
        {
          name: 'state',
          type: 'text',
          label: 'State',
        },
        {
          name: 'zip',
          type: 'text',
          label: 'ZIP Code',
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'latitude',
          type: 'number',
          label: 'Latitude',
          admin: {
            description: 'For mapping and routing',
          },
        },
        {
          name: 'longitude',
          type: 'number',
          label: 'Longitude',
          admin: {
            description: 'For mapping and routing',
          },
        },
      ],
    },
    {
      name: 'contactInfo',
      type: 'array',
      label: 'Contact Information',
      admin: {
        description: 'Phone numbers and contact methods',
      },
      fields: [
        {
          name: 'label',
          type: 'text',
          label: 'Label',
          admin: {
            placeholder: 'e.g., Base Phone, Duty Phone, Supervisor',
          },
        },
        {
          name: 'phoneNumber',
          type: 'text',
          label: 'Phone Number',
          admin: {
            placeholder: '(734) 555-1234',
          },
        },
      ],
    },
    {
      name: 'doorCodes',
      type: 'array',
      label: 'Door Codes',
      admin: {
        description: 'Entry codes for base access',
      },
      fields: [
        {
          name: 'code',
          type: 'text',
          label: 'Door Code',
          admin: {
            placeholder: 'e.g., Front door 1234#',
          },
        },
      ],
    },
    {
      name: 'assetsBasedThere',
      type: 'array',
      label: 'Assets Based Here',
      admin: {
        description: 'Vehicles and units stationed at this base',
      },
      fields: [
        {
          name: 'assetName',
          type: 'text',
          label: 'Asset Name',
          admin: {
            placeholder: 'e.g., Air Care 1, MICU 2, Ambulance 5',
          },
        },
      ],
    },
    {
      name: 'notes',
      type: 'textarea',
      label: 'Notes',
      admin: {
        description: 'Additional information about this base',
        rows: 5,
      },
    },
  ],
  timestamps: true,
}
