import type { CollectionConfig } from 'payload'
import { isContentOrAdmin } from '../access/roles'
import { sendAndLogNotification, sendAndLogAdminNotification, logAuditTrail, detectChanges } from '@/utilities/notificationHelpers'
import {
  hospitalChangeRequestSubmittedAdminEmail,
  hospitalChangeRequestApprovedEmail,
  hospitalChangeRequestRejectedEmail,
} from '@/utilities/emailTemplates'
import type { User } from '@/payload-types'

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
      async ({ req, operation, data, originalDoc }) => {
        // Set submittedBy on create
        if (operation === 'create' && req.user) {
          data.submittedBy = req.user.id
        }

        // Track amendments in audit trail
        if (operation === 'update' && originalDoc && req.user && req.payload) {
          // Check if proposedData was amended (admin edited it)
          const fieldsToCompare = ['name', 'squadPhone', 'coordinates', 'latitude', 'longitude']
          const previousProposedData = originalDoc.proposedData || {}
          const newProposedData = data.proposedData || {}

          const changes = detectChanges(previousProposedData, newProposedData, fieldsToCompare)

          if (changes.length > 0) {
            // Admin amended the proposed data
            await logAuditTrail(req.payload, {
              action: 'amended',
              collection: 'hospital-change-requests',
              documentId: originalDoc.id,
              changedBy: req.user.id,
              changes,
              metadata: {
                amendedBefore: originalDoc.status === 'pending' ? 'approval' : 'rejection',
              },
            })
          }
        }

        return data
      },
    ],
    afterChange: [
      async ({ req, doc, previousDoc, operation }) => {
        if (!req.payload) return doc

        // Handle creation - send admin notification when a new request is submitted
        if (operation === 'create') {
          try {
            // Fetch submittedBy user details
            const submittedByUser = doc.submittedBy
              ? await req.payload.findByID({
                  collection: 'users',
                  id: typeof doc.submittedBy === 'string' ? doc.submittedBy : doc.submittedBy.id || doc.submittedBy,
                })
              : null

            const emailTemplate = hospitalChangeRequestSubmittedAdminEmail({
              id: doc.id,
              type: doc.type,
              submittedBy: submittedByUser || undefined,
              proposedData: doc.proposedData,
              targetHospital: doc.targetHospital,
            })

            await sendAndLogAdminNotification(req.payload, {
              type: 'hospital_request_submitted_admin',
              subject: emailTemplate.subject,
              html: emailTemplate.html,
              relatedHospitalRequest: doc.id,
              relatedUser: submittedByUser?.id,
              createdBy: submittedByUser?.id, // User who submitted the request
            })

            // Log audit trail
            await logAuditTrail(req.payload, {
              action: 'created',
              collection: 'hospital-change-requests',
              documentId: doc.id,
              changedBy: submittedByUser?.id || doc.id,
              metadata: {
                type: doc.type,
                targetHospital: typeof doc.targetHospital === 'object' ? doc.targetHospital?.id : doc.targetHospital,
              },
            })
          } catch (error) {
            console.error('Failed to send hospital change request notification:', error)
          }

          return doc
        }

        // Handle updates - auto-apply approved changes
        // Only proceed if status just changed to 'approved'
        if (previousDoc?.status === 'approved') {
          // Already applied, don't reprocess
          return doc
        }

        const statusChanged = previousDoc && previousDoc.status !== doc.status

        if (doc.status !== 'approved' && doc.status !== 'rejected') {
          // Not approved or rejected yet
          return doc
        }

        // Handle approval
        if (doc.status === 'approved' && statusChanged) {
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

            // Send approval notification to submitter
            const submittedByUser = doc.submittedBy
              ? await req.payload.findByID({
                  collection: 'users',
                  id: typeof doc.submittedBy === 'string' ? doc.submittedBy : doc.submittedBy.id || doc.submittedBy,
                })
              : null

            if (submittedByUser?.email) {
              const emailTemplate = hospitalChangeRequestApprovedEmail(
                submittedByUser.email,
                (submittedByUser as User).name,
                {
                  type: doc.type,
                  proposedData: doc.proposedData,
                  targetHospital: doc.targetHospital,
                }
              )

              await sendAndLogNotification(req.payload, {
                type: 'hospital_request_approved',
                recipient: submittedByUser.email,
                recipientUser: submittedByUser.id,
                subject: emailTemplate.subject,
                html: emailTemplate.html,
                relatedHospitalRequest: doc.id,
                relatedUser: submittedByUser.id,
                createdBy: req.user?.id, // Admin/content who approved the request
              })
            }

            // Log audit trail
            await logAuditTrail(req.payload, {
              action: 'approved',
              collection: 'hospital-change-requests',
              documentId: doc.id,
              changedBy: req.user?.id || doc.id,
              changes: [
                { field: 'status', previousValue: previousDoc?.status || '', newValue: doc.status },
              ],
            })
          } catch (error) {
            console.error('HospitalChangeRequest: Failed to apply change', error)
            // Don't throw - we want the approval to succeed even if auto-apply fails
          }
        }

        // Handle rejection
        if (doc.status === 'rejected' && statusChanged) {
          try {
            // Send rejection notification to submitter
            const submittedByUser = doc.submittedBy
              ? await req.payload.findByID({
                  collection: 'users',
                  id: typeof doc.submittedBy === 'string' ? doc.submittedBy : doc.submittedBy.id || doc.submittedBy,
                })
              : null

            if (submittedByUser?.email) {
              const emailTemplate = hospitalChangeRequestRejectedEmail(
                submittedByUser.email,
                (submittedByUser as User).name,
                {
                  type: doc.type,
                  proposedData: doc.proposedData,
                  targetHospital: doc.targetHospital,
                },
                doc.rejectionReason || undefined
              )

              await sendAndLogNotification(req.payload, {
                type: 'hospital_request_rejected',
                recipient: submittedByUser.email,
                recipientUser: submittedByUser.id,
                subject: emailTemplate.subject,
                html: emailTemplate.html,
                relatedHospitalRequest: doc.id,
                relatedUser: submittedByUser.id,
                createdBy: req.user?.id, // Admin/content who rejected the request
              })
            }

            // Log audit trail
            await logAuditTrail(req.payload, {
              action: 'rejected',
              collection: 'hospital-change-requests',
              documentId: doc.id,
              changedBy: req.user?.id || doc.id,
              changes: [
                { field: 'status', previousValue: previousDoc?.status || '', newValue: doc.status },
              ],
              metadata: {
                rejectionReason: doc.rejectionReason,
              },
            })
          } catch (error) {
            console.error('HospitalChangeRequest: Failed to send rejection notification', error)
          }
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
              {
                name: 'description',
                type: 'textarea',
                label: 'Description / Notes',
                admin: {
                  rows: 2,
                },
              },
          ],
        },
        {
          name: 'doorCodes',
          type: 'array',
          label: 'Door Codes',
          fields: [
              {
                name: 'label',
                type: 'text',
                label: 'Door Label',
              },
            {
              name: 'code',
              type: 'text',
              label: 'Door Code',
            },
              {
                name: 'notes',
                type: 'textarea',
                label: 'Notes / Instructions',
                admin: {
                  rows: 2,
                },
              },
              {
                name: 'isPrimary',
                type: 'checkbox',
                label: 'Primary ED Access Code',
              },
              {
                name: 'colorTheme',
                type: 'select',
                label: 'Accent Color',
                dbName: 'theme',
                options: [
                  { label: 'Sunset (Amber)', value: 'sunset' },
                  { label: 'Slate', value: 'slate' },
                  { label: 'Sky', value: 'sky' },
                  { label: 'Emerald', value: 'emerald' },
                  { label: 'Violet', value: 'violet' },
                  { label: 'Rose', value: 'rose' },
                ],
              },
          ],
        },
          {
            name: 'helipad',
            type: 'group',
            label: 'Helipad Information',
            fields: [
              {
                name: 'identifier',
                type: 'text',
                label: 'Helipad Identifier',
              },
              {
                name: 'nightOperations',
                type: 'checkbox',
                label: 'IFR Approach',
              },
              {
                name: 'preferredApproach',
                type: 'text',
                label: 'Preferred Approach',
              },
              {
                name: 'notes',
                type: 'textarea',
                label: 'Additional Helipad Notes',
                admin: { rows: 3 },
              },
            ],
          },
          {
            name: 'campusMaps',
            type: 'array',
            label: 'Campus Maps',
            fields: [
              {
                name: 'label',
                type: 'text',
                required: true,
                label: 'Tab Label',
              },
              {
                name: 'slug',
                type: 'text',
                label: 'Tab Identifier',
              },
              {
                name: 'mapType',
                type: 'text',
                label: 'Map Type',
              },
              {
                name: 'description',
                type: 'textarea',
                label: 'Description',
                admin: { rows: 3 },
              },
              {
                name: 'mapMedia',
                type: 'upload',
                relationTo: 'media',
                label: 'Map Media',
              },
              {
                name: 'externalUrl',
                type: 'text',
                label: 'External Link',
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
      name: 'rejectionReason',
      type: 'textarea',
      label: 'Rejection Reason',
      admin: {
        description: 'Reason for rejecting this request (sent to user in notification email)',
        position: 'sidebar',
        condition: (data) => data.status === 'rejected',
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
