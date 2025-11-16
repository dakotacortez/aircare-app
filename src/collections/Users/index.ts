import type { CollectionConfig } from 'payload'
import type { User } from '@/payload-types'

class AuthBlockedError extends Error {
  status: number

  constructor(message: string, status = 403) {
    super(message)
    this.name = 'AuthBlockedError'
    this.status = status
  }
}

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    // Allow public self-registration, but only admins can create while logged in
    create: ({ req: { user } }) => {
      if (!user) return true
      return user.role === 'admin-team'
    },
    // Admins can delete any user, individuals can delete their own account
    delete: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin-team') return true
      return {
        id: {
          equals: user.id,
        },
      }
    },
    // Users can read and update their own profile, admins/content can read/update all
    read: ({ req: { user } }) => {
      // Admins and content team can read all users
      if (user?.role === 'admin-team' || user?.role === 'content-team') return true
      // Regular users can only read their own profile
      if (user) {
        return {
          id: {
            equals: user.id,
          },
        }
      }
      return false
    },
    update: ({ req: { user } }) => {
      // Admins and content team can update all users
      if (user?.role === 'admin-team' || user?.role === 'content-team') return true
      // Regular users can only update their own profile
      if (user) {
        return {
          id: {
            equals: user.id,
          },
        }
      }
      return false
    },
  },
  admin: {
    group: 'Administration',
    description: 'User management - Admin can add/delete, Content team can edit details',
    defaultColumns: ['name', 'email', 'role', 'status', 'defaultServiceLine'],
    useAsTitle: 'name',
  },
  auth: {
    tokenExpiration: 60 * 60 * 24 * 30, // ~30 days for offline/PWA access
    cookies: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
    },
    forgotPassword: {
      generateEmailHTML: (args) => {
        const resetURL = `${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'}/reset-password?token=${args?.token || ''}`
        return `
          <h2>Reset Your Password</h2>
          <p>Hi ${args?.user?.name || args?.user?.email || 'there'},</p>
          <p>You requested to reset your password. Click the link below to reset it:</p>
          <p><a href="${resetURL}">${resetURL}</a></p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
        `
      },
      generateEmailSubject: () => 'Reset Your Password - Air Care & Mobile Care',
    },
  },
  hooks: {
      beforeLogin: [
        async ({ user }) => {
          const typedUser = user as User | undefined

          // Admin team members can always login (bypass approval checks)
          if (typedUser?.role === 'admin-team') {
            return typedUser
          }

          // Check if user is approved and active
          if (!typedUser?.approved) {
            throw new AuthBlockedError(
              'Your account is pending approval. Please contact an administrator.',
            )
          }
          if (typedUser?.status !== 'active') {
            throw new AuthBlockedError(
              'Your account is not active. Please contact an administrator.',
            )
          }

          return typedUser
        },
      ],
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
          // Admins and content team can update for anyone
          return user?.role === 'admin-team' || user?.role === 'content-team'
        },
      },
    },
    {
      name: 'pushNotificationsEnabled',
      type: 'checkbox',
      label: 'Enable Push Notifications',
      defaultValue: false,
      admin: {
        description: 'Opt-in to receive push notifications for protocol updates and announcements',
        position: 'sidebar',
      },
      // Users can update their own preference, admins can update for anyone
      access: {
        create: () => true,
        update: ({ req: { user }, id }) => {
          // Users can update their own preference
          if (user && id && user.id === id) return true
          // Admins can update for anyone
          return user?.role === 'admin-team'
        },
      },
    },
    {
      name: 'profileImage',
      type: 'upload',
      relationTo: 'media',
      label: 'Profile Image',
      admin: {
        description: 'Upload a profile picture',
      },
      // Users can update their own image, admins can update for anyone
      access: {
        create: () => true,
        update: ({ req: { user }, id }) => {
          // Users can update their own image
          if (user && id && user.id === id) return true
          // Admins can update for anyone
          return user?.role === 'admin-team'
        },
      },
    },
  ],
  timestamps: true,
}
