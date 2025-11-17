import type { CollectionConfig } from 'payload'
import { isContentOrAdmin } from '../access/roles'

/**
 * Base Change Requests Collection
 *
 * Allows authenticated users to propose additions or updates to base records.
 * Approved requests automatically create or update base entries.
 */
export const BaseChangeRequests: CollectionConfig = {
  slug: 'base-change-requests',
  labels: {
    singular: 'Base Change Request',
    plural: 'Base Change Requests',
  },
  admin: {
    useAsTitle: 'type',
    defaultColumns: ['type', 'targetBase', 'status', 'submittedBy', 'createdAt'],
    group: 'Operations',
    description: 'User-submitted requests to add or update base information',
  },
  access: {
    create: ({ req: { user } }) => !!user,
    read: isContentOrAdmin,
    update: isContentOrAdmin,
    delete: isContentOrAdmin,
  },
  hooks: {
    beforeChange: [
      async ({ req, operation, data }) => {
        if (operation === 'create' && req.user) {
          data.submittedBy = req.user.id
        }
        return data
      },
    ],
    afterChange: [
      async ({ req, doc, previousDoc }) => {
        if (previousDoc?.status === 'approved') {
          return doc
        }

        if (doc.status !== 'approved') {
          return doc
        }

        const { type, targetBase, proposedData } = doc

        if (!proposedData) {
          console.warn('BaseChangeRequest approved but proposedData is missing')
          return doc
        }

        try {
          if (type === 'add') {
            await req.payload.create({
              collection: 'bases',
              data: proposedData,
              user: req.user,
            })
            console.log('BaseChangeRequest: Created new base from request', doc.id)
          } else if (type === 'update') {
            if (!targetBase) {
              console.warn('BaseChangeRequest: Update request missing targetBase')
              return doc
            }

            const baseId = typeof targetBase === 'string' ? targetBase : targetBase.id

            await req.payload.update({
              collection: 'bases',
              id: baseId,
              data: proposedData,
              user: req.user,
            })
            console.log('BaseChangeRequest: Updated base from request', doc.id)
          }

          await req.payload.update({
            collection: 'base-change-requests',
            id: doc.id,
            data: {
              appliedAt: new Date().toISOString(),
            },
            user: req.user,
            depth: 0,
          })
        } catch (error) {
          console.error('BaseChangeRequest: Failed to apply change', error)
        }

        return doc
      },
    ],
  },
  fields: [
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Add New Base', value: 'add' },
        { label: 'Update Existing Base', value: 'update' },
      ],
      admin: {
        description: 'Type of change request',
      },
    },
    {
      name: 'targetBase',
      type: 'relationship',
      relationTo: 'bases',
      label: 'Target Base',
      admin: {
        description: 'Base to update (required for update requests)',
        condition: (data) => data.type === 'update',
      },
    },
    {
      name: 'proposedData',
      type: 'group',
      label: 'Proposed Changes',
      admin: {
        description: 'The data to add or update',
      },
      fields: [
        {
          name: 'name',
          type: 'text',
          label: 'Base Name',
        },
        {
          name: 'address',
          type: 'group',
          label: 'Address',
          fields: [
            { name: 'line1', type: 'text', label: 'Address Line 1' },
            { name: 'line2', type: 'text', label: 'Address Line 2' },
            { name: 'city', type: 'text', label: 'City' },
            { name: 'state', type: 'text', label: 'State' },
            { name: 'zip', type: 'text', label: 'ZIP Code' },
          ],
        },
        {
          name: 'coordinates',
          type: 'text',
          label: 'Coordinates (Latitude, Longitude)',
        },
        {
          name: 'latitude',
          type: 'number',
          label: 'Latitude',
        },
        {
          name: 'longitude',
          type: 'number',
          label: 'Longitude',
        },
        {
          name: 'squadPhone',
          type: 'text',
          label: 'Squad Phone',
        },
        {
          name: 'contactInfo',
          type: 'array',
          label: 'Other Contact Information',
          fields: [
            { name: 'label', type: 'text', label: 'Label' },
            { name: 'phoneNumber', type: 'text', label: 'Phone Number' },
            {
              name: 'description',
              type: 'textarea',
              label: 'Description',
              admin: { rows: 2 },
            },
          ],
        },
        {
          name: 'doorCodes',
          type: 'array',
          label: 'Door Codes',
          fields: [
            { name: 'label', type: 'text', label: 'Door Label' },
            { name: 'code', type: 'text', label: 'Door Code' },
            {
              name: 'notes',
              type: 'textarea',
              label: 'Notes / Instructions',
              admin: { rows: 2 },
            },
          ],
        },
        {
          name: 'hazards',
          type: 'array',
          label: 'Notes & Hazards',
          fields: [
            {
              name: 'note',
              type: 'textarea',
              label: 'Hazard / Note',
              admin: { rows: 2 },
            },
          ],
        },
        {
          name: 'notes',
          type: 'textarea',
          label: 'General Notes',
          admin: { rows: 3 },
        },
        {
          name: 'sourceAttribution',
          type: 'text',
          label: 'Source Attribution',
        },
      ],
    },
    {
      name: 'submittedBy',
      type: 'relationship',
      relationTo: 'users',
      label: 'Submitted By',
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'User who submitted this request',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending Review', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
      ],
      admin: {
        description: 'When set to approved, changes are automatically applied to the base',
        position: 'sidebar',
      },
    },
    {
      name: 'adminNotes',
      type: 'textarea',
      label: 'Admin Notes',
      admin: {
        description: 'Internal notes about this request',
        position: 'sidebar',
      },
    },
    {
      name: 'appliedAt',
      type: 'date',
      label: 'Applied At',
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'When the change was automatically applied',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
  ],
  timestamps: true,
}
