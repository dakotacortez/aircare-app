import type { CollectionConfig, FieldHook, PayloadRequest } from 'payload'
import { isLoggedIn, isContentOrAdmin } from '../access/roles'

/**
 * Hospitals Collection
 * Main collection for hospital information including:
 * - Basic info (name, address, location)
 * - Network affiliation
 * - Contact information (phones, door codes)
 * - Clinical capabilities
 * - Notes for EMS crews
 */
export const Hospitals: CollectionConfig = {
  slug: 'hospitals',
  labels: {
    singular: 'Hospital',
    plural: 'Hospitals',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'address.city', 'network'],
    group: 'Hospitals',
    description: 'Hospital directory with contact info, capabilities, and EMS notes',
  },
  access: {
    // Only logged in users (no guests) can read
    read: isLoggedIn,
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
      name: 'name',
      type: 'text',
      required: true,
      label: 'Hospital Name',
      admin: {
        placeholder: 'e.g., St. Joseph Mercy Ann Arbor',
      },
    },
    {
      name: 'network',
      type: 'relationship',
      relationTo: 'hospital-networks',
      label: 'Hospital Network',
      admin: {
        description: 'Parent network/system this hospital belongs to',
      },
    },
    {
      name: 'networkLogoOverride',
      type: 'upload',
      relationTo: 'media',
      label: 'Network Logo Override',
      admin: {
        description: 'Override the network logo with a hospital-specific logo',
        condition: (data) => !!data.network,
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
          admin: {
            placeholder: 'MI',
          },
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
      name: 'squadPhone',
      type: 'text',
      label: 'Squad Phone',
      admin: {
        description: 'Primary EMS contact number',
        placeholder: '(734) 555-1234',
      },
    },
    {
      name: 'otherPhones',
      type: 'array',
      label: 'Other Phone Numbers',
      fields: [
        {
          name: 'label',
          type: 'text',
          label: 'Label',
          admin: {
            placeholder: 'e.g., OB Charge Nurse, Cath Lab',
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
        description: 'Entry codes for EMS access',
      },
      fields: [
        {
          name: 'code',
          type: 'text',
          label: 'Door Code',
          admin: {
            placeholder: 'e.g., ED door 0911#',
          },
        },
      ],
    },
    {
      name: 'capabilities',
      type: 'array',
      label: 'Hospital Capabilities',
      admin: {
        description: 'Add clinical capabilities and their certification levels',
      },
      fields: [
        {
          name: 'capability',
          type: 'relationship',
          relationTo: 'hospital-capabilities',
          required: true,
          label: 'Capability Type',
          admin: {
            description: 'Select a capability type (e.g., Trauma, PCI, Stroke)',
          },
        },
        {
          name: 'level',
          type: 'text',
          label: 'Certification Level',
          required: true,
          admin: {
            description: 'Select the certification level from the dropdown. Options are loaded from the selected Capability Type.',
            components: {
              Field: '@/components/fields/CapabilityLevelSelect',
            },
          },
          validate: async (value: unknown, { siblingData, req }: any) => {
            if (!value) {
              return 'Certification level is required'
            }

            const levelValue = value as string
            const capabilityId = siblingData?.capability

            if (!capabilityId) {
              return 'Please select a capability type first'
            }

            try {
              // Fetch the capability to validate the level
              const capability = await req.payload.findByID({
                collection: 'hospital-capabilities',
                id: typeof capabilityId === 'object' ? capabilityId.id : capabilityId,
              })

              if (!capability?.levels || capability.levels.length === 0) {
                return 'The selected capability has no levels defined. Please add levels in Capability Types first.'
              }

              // Check if the entered level matches one of the defined levels (case-insensitive)
              const validLevel = capability.levels.some(
                (levelObj: { level: string }) =>
                  levelObj.level.toLowerCase() === levelValue.toLowerCase(),
              )

              if (!validLevel) {
                const availableLevels = capability.levels
                  .map((l: { level: string }) => `"${l.level}"`)
                  .join(', ')
                return `Invalid level for ${capability.name}. Valid levels are: ${availableLevels}. Please enter the level exactly as shown.`
              }

              return true
            } catch (error) {
              console.error('Error validating capability level:', error)
              return 'Error validating level. Please try again.'
            }
          },
        },
      ],
    },
    {
      name: 'notes',
      type: 'textarea',
      label: 'Notes',
      admin: {
        description: 'Additional information for EMS crews',
        rows: 5,
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
        description: 'User who created this record',
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
        description: 'User who last updated this record',
      },
    },
  ],
  timestamps: true,
}
