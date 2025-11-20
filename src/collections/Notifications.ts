import type { CollectionConfig } from 'payload'
import { isContentOrAdmin } from '@/access/roles'

export const Notifications: CollectionConfig = {
  slug: 'notifications',
  admin: {
    useAsTitle: 'subject',
    defaultColumns: ['subject', 'type', 'recipient', 'status', 'createdAt'],
    group: 'System',
    description: 'Track all email notifications sent by the system',
  },
  access: {
    // Only content team and admins can view notifications
    read: isContentOrAdmin,
    create: isContentOrAdmin,
    update: isContentOrAdmin,
    delete: isContentOrAdmin,
  },
  fields: [
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        // User notifications
        { label: 'User Registration - Admin', value: 'user_registration_admin' },
        { label: 'User Approved', value: 'user_approved' },
        { label: 'User Rejected', value: 'user_rejected' },
        // Hospital change request notifications
        { label: 'Hospital Request Submitted - Admin', value: 'hospital_request_submitted_admin' },
        { label: 'Hospital Request Approved', value: 'hospital_request_approved' },
        { label: 'Hospital Request Rejected', value: 'hospital_request_rejected' },
        // Base change request notifications
        { label: 'Base Request Submitted - Admin', value: 'base_request_submitted_admin' },
        { label: 'Base Request Approved', value: 'base_request_approved' },
        { label: 'Base Request Rejected', value: 'base_request_rejected' },
      ],
      admin: {
        description: 'Type of notification sent',
      },
    },
    {
      name: 'recipient',
      type: 'email',
      required: true,
      admin: {
        description: 'Email address of the recipient',
      },
    },
    {
      name: 'recipientUser',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        description: 'User who received the notification (if applicable)',
      },
    },
    {
      name: 'subject',
      type: 'text',
      required: true,
      admin: {
        description: 'Email subject line',
      },
    },
    {
      name: 'htmlContent',
      type: 'textarea',
      admin: {
        description: 'HTML content of the email (for reference)',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Sent', value: 'sent' },
        { label: 'Failed', value: 'failed' },
      ],
      admin: {
        description: 'Status of the notification',
      },
    },
    {
      name: 'emailId',
      type: 'text',
      admin: {
        description: 'Email ID from the email service provider (e.g., Resend)',
        readOnly: true,
      },
    },
    {
      name: 'error',
      type: 'textarea',
      admin: {
        description: 'Error message if the email failed to send',
        readOnly: true,
      },
    },
    {
      name: 'relatedUser',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        description: 'User related to this notification (e.g., user who registered)',
      },
    },
    {
      name: 'relatedHospitalRequest',
      type: 'relationship',
      relationTo: 'hospital-change-requests',
      admin: {
        description: 'Hospital change request related to this notification',
      },
    },
    {
      name: 'relatedBaseRequest',
      type: 'relationship',
      relationTo: 'base-change-requests',
      admin: {
        description: 'Base change request related to this notification',
      },
    },
    {
      name: 'sentAt',
      type: 'date',
      admin: {
        description: 'When the notification was successfully sent',
        readOnly: true,
      },
    },
  ],
  timestamps: true,
}
