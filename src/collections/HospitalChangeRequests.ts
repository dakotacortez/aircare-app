import type { CollectionConfig } from 'payload'
import { isContentOrAdmin } from '../access/roles'

/**
 * Hospital Change Requests Collection
 * 
 * Allows any authenticated user to propose additions or updates to hospitals.
 * When an admin approves the request (sets status to 'approved'), 
 * the change is automatically applied to the hospitals collection.
 * 
 * Admin Workflow:
 * 1. Admin reviews the proposedData
 * 2. Admin edits it directly if needed (refining before approval)
 * 3. Admin sets status to 'approved'
 * 4. Save triggers the afterChange hook which creates or updates the hospital record
 * 5. appliedAt timestamp is automatically set
 */
export const HospitalChangeRequests: CollectionConfig = {
  slug: 'hospital-change-requests',
  labels: {
    singular: 'Hospital Change Request',
    plural: 'Hospital Change Requests',
  },
  admin: {
    useAsTitle: 'type',
    defaultColumns: ['type', 'targetHospital', 'status', 'submittedBy', 'createdAt'],
    group: 'Hospitals',
    description: 'User-submitted requests to add or update hospital information',
  },
  access: {
    // Any authenticated user can create
    create: ({ req: { user } }) => !!user,
    // Only content team or admin can read, update, delete
    read: isContentOrAdmin,
    update: isContentOrAdmin,
    delete: isContentOrAdmin,
  },
  hooks: {
    beforeChange: [
      async ({ req, operation, data }) => {
        // Set submittedBy on create
        if (operation === 'create' && req.user) {
          data.submittedBy = req.user.id
        }
        return data
      },
    ],
    afterChange: [
      async ({ req, doc, previousDoc }) => {
        // Auto-apply approved changes
        // Only proceed if status just changed to 'approved'
        if (previousDoc?.status === 'approved') {
          // Already applied, don't reprocess
          return doc
        }
        
        if (doc.status !== 'approved') {
          // Not approved yet
          return doc
        }

        // Status is now 'approved' and wasn't before - apply the change
        const { type, targetHospital, proposedData } = doc

        if (!proposedData) {
          console.warn('HospitalChangeRequest approved but proposedData is missing')
          return doc
        }

        try {
          if (type === 'add') {
            // Create new hospital
            await req.payload.create({
              collection: 'hospitals',
              data: proposedData,
              user: req.user,
            })
            console.log('HospitalChangeRequest: Created new hospital from request', doc.id)
          } else if (type === 'update') {
            // Update existing hospital
            if (!targetHospital) {
              console.warn('HospitalChangeRequest: Update request missing targetHospital')
              return doc
            }
            
            // Resolve hospital ID (could be string or object)
            const hospitalId = typeof targetHospital === 'string' 
              ? targetHospital 
              : targetHospital.id

            await req.payload.update({
              collection: 'hospitals',
              id: hospitalId,
              data: proposedData,
              user: req.user,
            })
            console.log('HospitalChangeRequest: Updated hospital from request', doc.id)
          }

          // Set appliedAt timestamp
          // Note: We need to update the doc directly here to avoid infinite loop
          await req.payload.update({
            collection: 'hospital-change-requests',
            id: doc.id,
            data: {
              appliedAt: new Date().toISOString(),
            },
            user: req.user,
            // Prevent hooks from running again
            depth: 0,
          })
        } catch (error) {
          console.error('HospitalChangeRequest: Failed to apply change', error)
          // Don't throw - we want the approval to succeed even if auto-apply fails
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
        { label: 'Add New Hospital', value: 'add' },
        { label: 'Update Existing Hospital', value: 'update' },
      ],
      admin: {
        description: 'Type of change request',
      },
    },
    {
      name: 'targetHospital',
      type: 'relationship',
      relationTo: 'hospitals',
      label: 'Target Hospital',
      admin: {
        description: 'Hospital to update (required for update requests)',
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
          label: 'Hospital Name',
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
          name: 'squadPhone',
          type: 'text',
          label: 'Squad Phone',
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
            },
            {
              name: 'phoneNumber',
              type: 'text',
              label: 'Phone Number',
            },
          ],
        },
        {
          name: 'doorCodes',
          type: 'array',
          label: 'Door Codes',
          fields: [
            {
              name: 'code',
              type: 'text',
              label: 'Door Code',
            },
          ],
        },
        {
          name: 'capabilities',
          type: 'array',
          label: 'Hospital Capabilities',
          fields: [
            {
              name: 'capability',
              type: 'relationship',
              relationTo: 'hospital-capabilities',
              label: 'Capability',
            },
            {
              name: 'level',
              type: 'text',
              label: 'Level',
            },
          ],
        },
        {
          name: 'notes',
          type: 'textarea',
          label: 'Notes',
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
        description: 'When set to approved, changes are automatically applied to the hospital',
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
