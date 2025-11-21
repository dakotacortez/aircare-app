import type { CollectionConfig } from 'payload'
import type { User } from '@/payload-types'
import { sendAndLogNotification, sendNotificationByType, logAuditTrail } from '@/utilities/notificationHelpers'
import {
  newUserRegistrationAdminEmail,
  userApprovedEmail,
  userRejectedEmail,
} from '@/utilities/emailTemplates'

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
      beforeChange: [
        async ({ data, originalDoc }) => {
          // Auto-approve users when setting them to active
          if (data.status === 'active') {
            const currentApproved = typeof data.approved === 'boolean' ? data.approved : originalDoc?.approved
            if (!currentApproved) {
              console.log('[Users Hook] Auto-approving user being set to active status')
              data.approved = true
            }
          }

          return data
        },
      ],
      afterChange: [
        async ({ req, doc, previousDoc, operation }) => {
          if (!req.payload) {
            return doc
          }

          // Defer all email/notification operations to prevent blocking the save
          setImmediate(async () => {
            try {
              // Handle creation - send admin notification when a new user registers immediately
              if (operation === 'create') {
                // Only send if this is a self-registration (no logged-in user or user registering is themselves)
                const isNewUserRegistration = !req.user || req.user.id === doc.id

                if (isNewUserRegistration) {
                  const emailTemplate = newUserRegistrationAdminEmail({
                    name: doc.name,
                    email: doc.email,
                    id: doc.id,
                  })

                  // Send notification to admins/content team based on role settings
                  await sendNotificationByType(req.payload, {
                    notificationType: 'user_registers',
                    subject: emailTemplate.subject,
                    html: emailTemplate.html,
                    relatedUser: doc.id,
                    createdBy: doc.id, // User registered themselves
                  })

                  // Log audit trail
                  await logAuditTrail(req.payload, {
                    action: 'created',
                    collection: 'users',
                    documentId: doc.id,
                    changedBy: doc.id, // User created themselves
                    metadata: {
                      role: doc.role,
                      status: doc.status,
                      approved: doc.approved,
                    },
                  })
                }
              }

              // Handle updates - send notifications on approval/rejection with 30s delay
              if (operation === 'update' && previousDoc) {
                const typedDoc = doc as User
                const typedPrevDoc = previousDoc as User

                // Check if user was just approved (status changed from pending to active AND approved changed to true)
                const wasJustApproved =
                  typedPrevDoc.status !== 'active' &&
                  typedDoc.status === 'active' &&
                  !typedPrevDoc.approved &&
                  typedDoc.approved

                // Check if user was just rejected (status changed to inactive AND approved is false)
                const wasJustRejected =
                  typedPrevDoc.status === 'pending' &&
                  typedDoc.status === 'inactive' &&
                  !typedDoc.approved

                // Delay approval/rejection emails by 30 seconds to allow accidental clicks to be corrected
                if ((wasJustApproved || wasJustRejected) && typedDoc.email) {
                  console.log(`[Users Hook] Scheduling ${wasJustApproved ? 'approval' : 'rejection'} email for user ${typedDoc.id} in 30 seconds...`)

                  setTimeout(async () => {
                    try {
                      if (wasJustApproved) {
                        const emailTemplate = userApprovedEmail({
                          name: typedDoc.name,
                          email: typedDoc.email,
                        })

                        await sendAndLogNotification(req.payload, {
                          type: 'user_approved',
                          recipient: typedDoc.email,
                          recipientUser: typedDoc.id,
                          subject: emailTemplate.subject,
                          html: emailTemplate.html,
                          relatedUser: typedDoc.id,
                          createdBy: req.user?.id, // Admin/content who approved the user
                        })

                        // Log audit trail
                        await logAuditTrail(req.payload, {
                          action: 'approved',
                          collection: 'users',
                          documentId: typedDoc.id,
                          changedBy: req.user?.id || typedDoc.id,
                          changes: [
                            { field: 'status', previousValue: typedPrevDoc.status, newValue: typedDoc.status },
                            { field: 'approved', previousValue: String(typedPrevDoc.approved), newValue: String(typedDoc.approved) },
                          ],
                        })

                        console.log(`[Users Hook] Approval email sent to user ${typedDoc.id}`)
                      } else if (wasJustRejected) {
                        const emailTemplate = userRejectedEmail(
                          {
                            name: typedDoc.name,
                            email: typedDoc.email,
                          },
                          typedDoc.rejectionReason || undefined
                        )

                        await sendAndLogNotification(req.payload, {
                          type: 'user_rejected',
                          recipient: typedDoc.email,
                          recipientUser: typedDoc.id,
                          subject: emailTemplate.subject,
                          html: emailTemplate.html,
                          relatedUser: typedDoc.id,
                          createdBy: req.user?.id, // Admin/content who rejected the user
                        })

                        // Log audit trail
                        await logAuditTrail(req.payload, {
                          action: 'rejected',
                          collection: 'users',
                          documentId: typedDoc.id,
                          changedBy: req.user?.id || typedDoc.id,
                          changes: [
                            { field: 'status', previousValue: typedPrevDoc.status, newValue: typedDoc.status },
                            { field: 'approved', previousValue: String(typedPrevDoc.approved), newValue: String(typedDoc.approved) },
                          ],
                          metadata: {
                            rejectionReason: typedDoc.rejectionReason,
                          },
                        })

                        console.log(`[Users Hook] Rejection email sent to user ${typedDoc.id}`)
                      }
                    } catch (error) {
                      console.error('[Users Hook] Error sending delayed notification:', error)
                    }
                  }, 30000) // 30 second delay
                }
              }
            } catch (error) {
              console.error('[Users Hook] Error in deferred afterChange operations:', error)
            }
          })

          return doc
        },
      ],
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
      name: 'rejectionReason',
      type: 'textarea',
      label: 'Rejection Reason',
      admin: {
        description: 'Reason for rejecting this user registration (sent to user in notification email)',
        position: 'sidebar',
        condition: (data) => data.status === 'inactive' && !data.approved,
      },
      access: {
        create: () => false, // Not set during signup
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
      name: 'emailNotificationsEnabled',
      type: 'checkbox',
      label: 'Enable Email Notifications',
      defaultValue: true,
      admin: {
        description: 'Opt-in to receive email notifications for account updates and requests',
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
      name: 'fcmTokens',
      type: 'array',
      label: 'FCM Tokens (Firebase Cloud Messaging)',
      admin: {
        description: 'Device tokens for push notifications (automatically managed by mobile app)',
        readOnly: true,
        hidden: true,
      },
      fields: [
        {
          name: 'token',
          type: 'text',
          required: true,
        },
        {
          name: 'platform',
          type: 'select',
          options: [
            { label: 'Android', value: 'android' },
            { label: 'iOS', value: 'ios' },
            { label: 'Web', value: 'web' },
          ],
        },
        {
          name: 'lastUsed',
          type: 'date',
          admin: {
            date: {
              pickerAppearance: 'dayAndTime',
            },
          },
        },
      ],
      access: {
        create: () => true,
        read: ({ req: { user }, id }) => {
          // Users can read their own tokens, admins can read all
          if (user && id && user.id === id) return true
          return user?.role === 'admin-team'
        },
        update: ({ req: { user }, id }) => {
          // Users can update their own tokens (mobile app registration)
          if (user && id && user.id === id) return true
          return user?.role === 'admin-team'
        },
      },
    },
    {
      name: 'notificationPreferences',
      type: 'group',
      label: 'Email Notification Preferences',
      admin: {
        description: 'Choose which email notifications you want to receive',
      },
      fields: [
        {
          name: 'userRegistrations',
          type: 'checkbox',
          label: 'User Registrations',
          defaultValue: true,
          admin: {
            description: 'Get notified when new users register (Admin/Content team only)',
            condition: (data, siblingData, { user }) => {
              return user?.role === 'admin-team' || user?.role === 'content-team'
            },
          },
        },
        {
          name: 'changeRequests',
          type: 'checkbox',
          label: 'Hospital/Base Change Requests',
          defaultValue: true,
          admin: {
            description: 'Get notified when users submit change requests (Admin/Content team only)',
            condition: (data, siblingData, { user }) => {
              return user?.role === 'admin-team' || user?.role === 'content-team'
            },
          },
        },
        {
          name: 'systemNotifications',
          type: 'checkbox',
          label: 'System Notifications',
          defaultValue: true,
          admin: {
            description: 'Get notified about system events and critical updates (Admin team only)',
            condition: (data, siblingData, { user }) => {
              return user?.role === 'admin-team'
            },
          },
        },
      ],
      access: {
        create: () => true,
        update: ({ req: { user }, id }) => {
          // Users can update their own preferences
          if (user && id && user.id === id) return true
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
