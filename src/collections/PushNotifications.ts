import type { CollectionConfig } from 'payload'
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
      async ({ doc, req, operation }) => {
        // Automatically send notifications when a new document is saved
        if (operation === 'create') {
          console.log('[Push Notifications Hook] Starting afterChange hook for push notification:', doc.id)

          // Run the notification sending asynchronously AFTER the hook completes
          // This prevents issues with updating the document from within its own afterChange hook
          setImmediate(async () => {
            try {
              // Mark as sending while the notification is dispatched
              console.log('[Push Notifications Hook] Step 1: Updating status to sending...')
              await req.payload.update({
                collection: 'push-notifications',
                id: doc.id,
                data: {
                  status: 'sending',
                },
                overrideAccess: true,
              })
              console.log('[Push Notifications Hook] Step 1: Status updated to sending')

              // Get all users matching the target roles
              console.log('[Push Notifications Hook] Step 2: Querying users with roles:', doc.targetRoles)
              const { docs: users } = await req.payload.find({
              collection: 'users',
              overrideAccess: true,
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
            console.log('[Push Notifications Hook] Step 2: Found', users.length, 'users')

            if (users.length === 0) {
              // No recipients found
              console.log('[Push Notifications Hook] No recipients found, marking as failed')
              await req.payload.update({
                collection: 'push-notifications',
                id: doc.id,
                data: {
                  status: 'failed',
                  error: 'No users found with push notifications enabled for the selected roles',
                },
                overrideAccess: true,
              })
              return doc
            }

            // Send push notification to each user
            console.log('[Push Notifications Hook] Step 3: Sending push notifications to', users.length, 'users...')
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

            console.log('[Push Notifications Hook] Step 3: Waiting for all notifications to send...')
            await Promise.all(sendPromises)
            console.log('[Push Notifications Hook] Step 3: All notifications sent successfully')

            // Update status to sent
            await req.payload.update({
              collection: 'push-notifications',
              id: doc.id,
              data: {
                status: 'sent',
                recipientCount: users.length,
                sentAt: new Date().toISOString(),
              },
              overrideAccess: true,
            })

              console.log(`Push notification sent to ${users.length} users`)
            } catch (error) {
              console.error('❌ [Push Notifications Collection] Error in afterChange hook:', error)
              if (error instanceof Error) {
                console.error('❌ [Push Notifications Collection] Error message:', error.message)
                console.error('❌ [Push Notifications Collection] Error stack:', error.stack)
              }
              console.error('❌ [Push Notifications Collection] Full error object:', JSON.stringify(error, null, 2))

              // Update status to failed
              await req.payload.update({
                collection: 'push-notifications',
                id: doc.id,
                data: {
                  status: 'failed',
                  error: error instanceof Error ? error.message : String(error),
                },
                overrideAccess: true,
              })
            }
          })
        }

        return doc
      },
    ],
  },
}

export default PushNotifications
