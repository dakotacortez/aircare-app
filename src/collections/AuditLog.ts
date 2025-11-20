import type { CollectionConfig } from 'payload'
import { isContentOrAdmin } from '@/access/roles'

export const AuditLog: CollectionConfig = {
  slug: 'audit-log',
  admin: {
    useAsTitle: 'action',
    defaultColumns: ['action', 'collection', 'documentId', 'changedBy', 'createdAt'],
    group: 'System',
    description: 'Detailed audit trail of all changes made to change requests',
  },
  access: {
    // Only content team and admins can view audit logs
    read: isContentOrAdmin,
    // Audit logs are created automatically, not manually
    create: () => true, // Allow system to create
    update: () => false, // Never update audit logs
    delete: isContentOrAdmin, // Only admins can delete (for cleanup)
  },
  fields: [
    {
      name: 'action',
      type: 'select',
      required: true,
      options: [
        { label: 'Created', value: 'created' },
        { label: 'Updated', value: 'updated' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
        { label: 'Amended', value: 'amended' },
        { label: 'Status Changed', value: 'status_changed' },
      ],
      admin: {
        description: 'Type of action performed',
      },
    },
    {
      name: 'collection',
      type: 'select',
      required: true,
      options: [
        { label: 'Users', value: 'users' },
        { label: 'Hospital Change Requests', value: 'hospital-change-requests' },
        { label: 'Base Change Requests', value: 'base-change-requests' },
        { label: 'Hospitals', value: 'hospitals' },
        { label: 'Bases', value: 'bases' },
      ],
      admin: {
        description: 'Collection that was modified',
      },
    },
    {
      name: 'documentId',
      type: 'text',
      required: true,
      admin: {
        description: 'ID of the document that was modified',
      },
    },
    {
      name: 'changedBy',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        description: 'User who made the change',
      },
    },
    {
      name: 'changes',
      type: 'array',
      label: 'Field Changes',
      admin: {
        description: 'Detailed list of field changes',
      },
      fields: [
        {
          name: 'field',
          type: 'text',
          required: true,
          admin: {
            description: 'Name of the field that changed',
          },
        },
        {
          name: 'previousValue',
          type: 'textarea',
          admin: {
            description: 'Previous value (JSON stringified if complex)',
          },
        },
        {
          name: 'newValue',
          type: 'textarea',
          admin: {
            description: 'New value (JSON stringified if complex)',
          },
        },
      ],
    },
    {
      name: 'metadata',
      type: 'json',
      admin: {
        description: 'Additional metadata about the change',
      },
    },
    {
      name: 'ipAddress',
      type: 'text',
      admin: {
        description: 'IP address of the user who made the change',
      },
    },
    {
      name: 'userAgent',
      type: 'text',
      admin: {
        description: 'User agent of the browser/client',
      },
    },
  ],
  timestamps: true, // Automatically adds createdAt and updatedAt
}
