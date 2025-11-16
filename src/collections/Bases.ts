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
    defaultColumns: ['name', 'slug', 'address.city'],
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
            name: 'label',
            type: 'text',
            label: 'Door Label',
            admin: {
              placeholder: 'e.g., Front Entrance',
            },
          },
          {
            name: 'code',
            type: 'text',
            label: 'Door Code',
            admin: {
              placeholder: 'e.g., 1234#',
            },
          },
        ],
      },
    {
      name: 'assets',
      type: 'relationship',
      relationTo: 'assets' as any,
      hasMany: true,
      label: 'Assets Based Here',
      admin: {
        description: 'Select vehicles and units stationed at this base. Assets already assigned to other bases will not appear in the list.',
      },
      filterOptions: (async ({ id, relationTo, data, siblingData, req }: any) => {
        // This will filter out assets that are already assigned to OTHER bases
        try {
          // Query all other bases (not the current one being edited)
          const allBases = await req.payload.find({
            collection: 'bases',
            where: {
              id: {
                not_equals: id,
              },
            },
            limit: 1000,
          })

          // Collect all asset IDs that are assigned to other bases
          const assignedAssetIds: number[] = []

          if (allBases?.docs) {
            allBases.docs.forEach((base: any) => {
              if (base.assets && Array.isArray(base.assets)) {
                base.assets.forEach((asset: any) => {
                  const assetId = typeof asset === 'object' ? asset.id : asset
                  if (assetId && !assignedAssetIds.includes(assetId)) {
                    assignedAssetIds.push(assetId)
                  }
                })
              }
            })
          }

          // Return filter to exclude already assigned assets
          if (assignedAssetIds.length > 0) {
            return {
              id: {
                not_in: assignedAssetIds,
              },
            }
          }

          // If no assets are assigned elsewhere, show all
          return {}
        } catch (error) {
          console.error('Error filtering assets:', error)
          // On error, show all assets
          return {}
        }
      }) as any,
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
