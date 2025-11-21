import type { CollectionConfig } from 'payload'
import { isContentOrAdmin } from '@/access/roles'

export const Notifications: CollectionConfig = {
  slug: 'notifications',
  admin: {
    useAsTitle: 'subject',
    defaultColumns: ['subject', 'type', 'recipient', 'createdBy', 'status', 'createdAt'],
    group: 'System',
    description: 'Track all email notifications sent by the system',
  },
  access: {
    // Only content team and admins can view notifications
    read: isContentOrAdmin,
    // Notifications are created automatically by the system, not manually
    create: () => false,
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
        { label: 'User Registers', value: 'user_registers' },
        { label: 'User Approved', value: 'user_approved' },
        { label: 'User Deactivated/Perms Removed', value: 'user_deactivated' },
        { label: 'User Deleted', value: 'user_deleted' },
        // Change request notifications
        { label: 'Base Change Request Submitted', value: 'base_change_request_submitted' },
        { label: 'Hospital Change Request Submitted', value: 'hospital_change_request_submitted' },
        { label: 'New Base Submitted', value: 'new_base_submitted' },
        { label: 'New Hospital Submitted', value: 'new_hospital_submitted' },
        { label: 'Request Approved', value: 'request_approved' },
        { label: 'Request Denied', value: 'request_denied' },
        // Legacy types for backward compatibility
        { label: 'User Registration - Admin (Legacy)', value: 'user_registration_admin' },
        { label: 'User Rejected (Legacy)', value: 'user_rejected' },
        { label: 'Hospital Request Submitted - Admin (Legacy)', value: 'hospital_request_submitted_admin' },
        { label: 'Hospital Request Approved (Legacy)', value: 'hospital_request_approved' },
        { label: 'Hospital Request Rejected (Legacy)', value: 'hospital_request_rejected' },
        { label: 'Base Request Submitted - Admin (Legacy)', value: 'base_request_submitted_admin' },
        { label: 'Base Request Approved (Legacy)', value: 'base_request_approved' },
        { label: 'Base Request Rejected (Legacy)', value: 'base_request_rejected' },
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
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        description: 'User who triggered/created this notification',
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
