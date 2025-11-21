import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access/roles'

export type NotificationType =
  | 'user_registers'
  | 'user_approved'
  | 'user_deactivated'
  | 'user_deleted'
  | 'base_change_request_submitted'
  | 'hospital_change_request_submitted'
  | 'new_base_submitted'
  | 'new_hospital_submitted'
  | 'request_approved'
  | 'request_denied'

export type NotificationRole = 'admin' | 'content_team' | 'user'

const NotificationSettings: CollectionConfig = {
  slug: 'notification-settings',
  admin: {
    useAsTitle: 'notificationType',
    defaultColumns: ['notificationType', 'updatedAt'],
    group: 'System',
  },
  access: {
    read: isAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'notificationType',
      type: 'select',
      required: true,
      unique: true,
      options: [
        { label: 'User Registers', value: 'user_registers' },
        { label: 'User Approved', value: 'user_approved' },
        { label: 'User Deactivated/Perms Removed', value: 'user_deactivated' },
        { label: 'User Deleted', value: 'user_deleted' },
        { label: 'Base Change Request Submitted', value: 'base_change_request_submitted' },
        { label: 'Hospital Change Request Submitted', value: 'hospital_change_request_submitted' },
        { label: 'New Base Submitted', value: 'new_base_submitted' },
        { label: 'New Hospital Submitted', value: 'new_hospital_submitted' },
        { label: 'Request Approved', value: 'request_approved' },
        { label: 'Request Denied', value: 'request_denied' },
      ],
    },
    {
      name: 'adminNotifications',
      type: 'group',
      label: 'Admin Notifications',
      fields: [
        {
          name: 'pushEnabled',
          type: 'checkbox',
          label: 'Push Notifications',
          defaultValue: true,
        },
        {
          name: 'emailEnabled',
          type: 'checkbox',
          label: 'Email Notifications',
          defaultValue: true,
        },
      ],
    },
    {
      name: 'contentTeamNotifications',
      type: 'group',
      label: 'Content Team Notifications',
      fields: [
        {
          name: 'pushEnabled',
          type: 'checkbox',
          label: 'Push Notifications',
          defaultValue: false,
        },
        {
          name: 'emailEnabled',
          type: 'checkbox',
          label: 'Email Notifications',
          defaultValue: false,
        },
      ],
    },
    {
      name: 'userNotifications',
      type: 'group',
      label: 'User Notifications',
      fields: [
        {
          name: 'pushEnabled',
          type: 'checkbox',
          label: 'Push Notifications',
          defaultValue: true,
        },
        {
          name: 'emailEnabled',
          type: 'checkbox',
          label: 'Email Notifications',
          defaultValue: true,
        },
      ],
    },
  ],
}

export default NotificationSettings
