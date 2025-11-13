import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    // Only Content Team and Admin Team can access the admin panel
    admin: ({ req: { user } }) => {
      if (!user) return false
      return (
        (user.role === 'content-team' || user.role === 'admin-team') &&
        user.status === 'active'
      )
    },
    // Allow anyone to create an account (they'll start as pending user)
    create: () => true,
    delete: authenticated,
    read: authenticated,
    update: authenticated,
  },
  admin: {
    defaultColumns: ['name', 'email', 'role', 'status', 'defaultServiceLine'],
    useAsTitle: 'name',
  },
  auth: {
    tokenExpiration: 172800, // 48 hours (2 days) - grace period for offline access
    cookies: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
    },
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'user',
      options: [
        { label: 'User (Clinical Team Member)', value: 'user' },
        { label: 'Content Team', value: 'content-team' },
        { label: 'Admin Team', value: 'admin-team' },
      ],
      admin: {
        description: 'User role determines access level',
        position: 'sidebar',
      },
      // Only admins can change roles
      access: {
        create: () => true, // Allow during signup (defaults to 'user')
        update: ({ req: { user } }) => {
          // Only admin-team can promote/demote users
          return user?.role === 'admin-team'
        },
      },
    },
    {
      name: 'approved',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Content Team or Admin must approve new user signups',
        position: 'sidebar',
      },
      // Only content-team and admin-team can approve users
      access: {
        create: () => true, // Allow during signup (defaults to false)
        update: ({ req: { user } }) => {
          return user?.role === 'content-team' || user?.role === 'admin-team'
        },
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending Approval', value: 'pending' },
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
      ],
      admin: {
        description: 'User account status',
        position: 'sidebar',
      },
      // Only content-team and admin-team can change status
      access: {
        create: () => true, // Allow during signup (defaults to 'pending')
        update: ({ req: { user } }) => {
          return user?.role === 'content-team' || user?.role === 'admin-team'
        },
      },
    },
    {
      name: 'defaultServiceLine',
      type: 'select',
      label: 'Default Service Line',
      defaultValue: 'ALS',
      options: [
        { label: 'BLS (Basic Life Support)', value: 'BLS' },
        { label: 'ALS (Advanced Life Support)', value: 'ALS' },
        { label: 'CCT (Critical Care Transport)', value: 'CCT' },
      ],
      admin: {
        description: 'Default protocol level for this user. Users can still toggle between levels, but this will be their starting preference.',
        position: 'sidebar',
      },
      // Users can update their own preference, admins can update for anyone
      access: {
        create: () => true,
        // Read access inherited from collection-level (authenticated users can read)
        update: ({ req: { user }, id }) => {
          // Users can update their own preference
          if (user && id && user.id === id) return true
          // Admins can update for anyone
          return user?.role === 'admin-team'
        },
      },
    },
  ],
  timestamps: true,
}
