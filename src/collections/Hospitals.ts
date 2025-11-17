import type { CollectionConfig } from 'payload'
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
    defaultColumns: ['name', 'slug', 'address.city', 'network'],
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
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      label: 'URL Slug',
      admin: {
        description: 'URL-friendly identifier (auto-generated from name)',
        position: 'sidebar',
      },
      hooks: {
        beforeValidate: [
          ({ value, data, operation }) => {
            // Auto-generate slug from name on create or if slug is empty
            if ((operation === 'create' || !value) && data?.name) {
              return data.name
                .toLowerCase()
                .trim()
                .replace(/[^\w\s-]/g, '')
                .replace(/[\s_-]+/g, '-')
                .replace(/^-+|-+$/g, '')
            }
            return value
          },
        ],
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
      name: 'coordinates',
      type: 'text',
      label: 'Coordinates (Latitude, Longitude)',
      admin: {
        description: 'Paste from Google Maps (e.g., "39.136774, -84.502021"). We\'ll parse it automatically.',
        placeholder: '39.136774, -84.502021',
      },
      hooks: {
        beforeChange: [
          ({ value, siblingData }) => {
            if (!value) return value
            
            // Parse various coordinate formats
            const coordStr = String(value).trim()
            
            // Try to extract two numbers from the string
            // Handles: "lat,lng" "lat, lng" "lat lng" "lat, -lng" etc.
            const matches = coordStr.match(/-?\d+\.?\d*/g)
            
            if (matches && matches.length >= 2) {
              const lat = parseFloat(matches[0])
              const lng = parseFloat(matches[1])
              
              if (!isNaN(lat) && !isNaN(lng)) {
                // Store parsed values in sibling fields
                siblingData.latitude = lat
                siblingData.longitude = lng
              }
            }
            
            return value
          },
        ],
        afterRead: [
          ({ data }) => {
            // Reconstruct the display value from lat/lng
            if (data?.latitude && data?.longitude) {
              return `${data.latitude}, ${data.longitude}`
            }
            return ''
          },
        ],
      },
    },
    {
      name: 'latitude',
      type: 'number',
      label: 'Latitude',
      admin: {
        hidden: true,
        description: 'Auto-populated from coordinates field',
      },
    },
    {
      name: 'longitude',
      type: 'number',
      label: 'Longitude',
      admin: {
        hidden: true,
        description: 'Auto-populated from coordinates field',
      },
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
        admin: {
          description: 'Secondary contacts such as charge nurses, security, etc.',
        },
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
          {
            name: 'description',
            type: 'textarea',
            label: 'Description / Notes',
            admin: {
              rows: 2,
              description: 'Short context for when to call this contact.',
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
            name: 'label',
            type: 'text',
            label: 'Door Label',
            admin: {
              placeholder: 'e.g., ED Entrance',
            },
          },
          {
            name: 'code',
            type: 'text',
            label: 'Door Code',
            admin: {
              placeholder: 'e.g., 0911#',
            },
          },
            {
              name: 'notes',
              type: 'textarea',
              label: 'Notes / Instructions',
              admin: {
                rows: 2,
                description: 'Optional context such as time restrictions or access notes.',
              },
            },
            {
              name: 'isPrimary',
              type: 'checkbox',
              label: 'Primary ED Access Code',
              admin: {
                description: 'Displayed in quick actions for rapid access.',
              },
            },
            {
              name: 'colorTheme',
              type: 'select',
              label: 'Accent Color',
              defaultValue: 'sunset',
              dbName: 'theme',
              options: [
                { label: 'Sunset (Amber)', value: 'sunset' },
                { label: 'Slate', value: 'slate' },
                { label: 'Sky', value: 'sky' },
                { label: 'Emerald', value: 'emerald' },
                { label: 'Violet', value: 'violet' },
                { label: 'Rose', value: 'rose' },
              ],
              admin: {
                description: 'Purely visual – helps differentiate door cards in the UI.',
              },
            },
        ],
      },
      {
        name: 'helipad',
        type: 'group',
        label: 'Helipad Information',
        admin: {
          description: 'Details for air medical operations.',
        },
        fields: [
          {
            name: 'identifier',
            type: 'text',
            label: 'Helipad Identifier',
            admin: {
              placeholder: 'e.g., UCMC H1',
            },
          },
          {
            name: 'nightOperations',
            type: 'checkbox',
            label: 'Night Operations Supported',
            defaultValue: false,
          },
          {
            name: 'preferredApproach',
            type: 'text',
            label: 'Preferred Approach',
            admin: {
              placeholder: 'e.g., From the north, avoid overflying main tower',
            },
          },
          {
            name: 'notes',
            type: 'textarea',
            label: 'Additional Helipad Notes',
            admin: {
              rows: 3,
            },
          },
        ],
      },
      {
        name: 'campusMaps',
        type: 'array',
        label: 'Campus Maps',
        labels: {
          singular: 'Map Tab',
          plural: 'Map Tabs',
        },
        admin: {
          description: 'Upload or link to common approach maps (ambulance route, bays, interior, etc.)',
        },
        fields: [
          {
            name: 'label',
            type: 'text',
            label: 'Tab Label',
            required: true,
            admin: {
              placeholder: 'e.g., Ambulance Route',
            },
          },
          {
            name: 'slug',
            type: 'text',
            label: 'Tab Identifier',
            admin: {
              description: 'Optional stable ID used for deep-linking tabs. Defaults to a slugified label if blank.',
            },
          },
          {
            name: 'mapType',
            type: 'select',
            label: 'Map Type',
            defaultValue: 'custom',
            options: [
              { label: 'Ambulance Route', value: 'ambulance' },
              { label: 'Interior Layout', value: 'interior' },
              { label: 'Parking & Bays', value: 'parking' },
              { label: 'Landing Zone', value: 'lz' },
              { label: 'Custom', value: 'custom' },
            ],
          },
          {
            name: 'description',
            type: 'textarea',
            label: 'Description or Instructions',
            admin: {
              rows: 3,
            },
          },
          {
            name: 'mapMedia',
            type: 'upload',
            relationTo: 'media',
            label: 'Map Image / PDF',
          },
          {
            name: 'externalUrl',
            type: 'text',
            label: 'External Map Link',
            admin: {
              description: 'Optional link to open in Google Maps, PDF, etc.',
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
            allowCreate: false,
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
          validate: async (value: unknown, { siblingData, req }: { siblingData?: Record<string, unknown>; req: { payload: { findByID: (args: { collection: string; id: number | string }) => Promise<{ levels?: Array<{ level: string }> }> } } }) => {
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
        name: 'hazards',
        type: 'array',
        label: 'Notes & Hazards',
        admin: {
          description: 'Callouts that should surface in the card UI.',
        },
        fields: [
          {
            name: 'note',
            type: 'textarea',
            label: 'Hazard / Note',
            required: true,
            admin: {
              rows: 2,
            },
          },
        ],
      },
      {
        name: 'sourceAttribution',
        type: 'text',
        label: 'Source Attribution',
        admin: {
          description: 'Shown under the card (e.g., “Air Care & Mobile Care education team”).',
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
