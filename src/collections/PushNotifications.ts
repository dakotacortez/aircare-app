import { CollectionConfig } from 'payload'
import { isAdmin } from '../access/roles'
import { sendPushNotificationToUser } from '../utilities/notificationHelpers'

const PushNotifications: CollectionConfig = {
  slug: 'push-notifications',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'targetRoles', 'status', 'createdAt'],
    group: 'System',
    description: 'Send push notifications to users by role',
  },
  access: {
    read: isAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Notification Title',
      admin: {
        description: 'The title that appears in the push notification',
      },
    },
    {
      name: 'body',
      type: 'textarea',
      required: true,
      label: 'Notification Body',
      admin: {
        description: 'The message content (max 200 characters recommended)',
      },
    },
    {
      name: 'targetRoles',
      type: 'select',
      required: true,
      hasMany: true,
      label: 'Target Roles',
      options: [
        { label: 'Admin Team', value: 'admin-team' },
        { label: 'Content Team', value: 'content-team' },
        { label: 'Users', value: 'user' },
      ],
      admin: {
        description: 'Select which user roles should receive this notification',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Sending', value: 'sending' },
        { label: 'Sent', value: 'sent' },
        { label: 'Failed', value: 'failed' },
      ],
      admin: {
        description: 'Status of the notification',
        readOnly: true,
      },
    },
    {
      name: 'recipientCount',
      type: 'number',
      admin: {
        description: 'Number of users who received this notification',
        readOnly: true,
      },
    },
    {
      name: 'error',
      type: 'textarea',
      admin: {
        description: 'Error message if the notification failed',
        readOnly: true,
        condition: (data) => data.status === 'failed',
      },
    },
    {
      name: 'sentAt',
      type: 'date',
      admin: {
        description: 'When the notification was sent',
        readOnly: true,
        condition: (data) => data.status === 'sent',
      },
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc, req, operation, previousDoc }) => {
        // Only send when transitioning from draft to sending (via admin action)
        // This prevents accidental sends on create
        if (operation === 'update' && previousDoc.status === 'draft' && doc.status === 'sending') {
          try {
            // Get all users matching the target roles
            const { docs: users } = await req.payload.find({
              collection: 'users',
              where: {
                and: [
                  {
                    role: {
                      in: doc.targetRoles,
                    },
                  },
                  {
                    approved: {
                      equals: true,
                    },
                  },
                  {
                    status: {
                      equals: 'active',
                    },
                  },
                  {
                    pushNotificationsEnabled: {
                      equals: true,
                    },
                  },
                ],
              },
              limit: 1000,
            })

            if (users.length === 0) {
              // No recipients found
              await req.payload.update({
                collection: 'push-notifications',
                id: doc.id,
                data: {
                  status: 'failed',
                  error: 'No users found with push notifications enabled for the selected roles',
                },
              })
              return doc
            }

            // Send push notification to each user
            const sendPromises = users.map((user) =>
              sendPushNotificationToUser(req.payload, user.id, {
                title: doc.title,
                body: doc.body,
                data: {
                  type: 'admin_broadcast',
                  notificationId: String(doc.id),
                },
              })
            )

            await Promise.all(sendPromises)

            // Update status to sent
            await req.payload.update({
              collection: 'push-notifications',
              id: doc.id,
              data: {
                status: 'sent',
                recipientCount: users.length,
                sentAt: new Date().toISOString(),
              },
            })

            console.log(`Push notification sent to ${users.length} users`)
          } catch (error) {
            console.error('Error sending push notification:', error)

            // Update status to failed
            await req.payload.update({
              collection: 'push-notifications',
              id: doc.id,
              data: {
                status: 'failed',
                error: error instanceof Error ? error.message : 'Unknown error',
              },
            })
          }
        }

        return doc
      },
    ],
  },
}

export default PushNotifications
