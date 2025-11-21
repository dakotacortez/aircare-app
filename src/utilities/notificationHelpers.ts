import type { Payload } from 'payload'
import { sendEmail } from './email'
import type {
  AuditLog,
  BaseChangeRequest,
  HospitalChangeRequest,
  Notification,
  NotificationSetting,
  User,
} from '@/payload-types'
import admin from 'firebase-admin'
import type { NotificationType } from '@/collections/NotificationSettings'

/**
 * Type for FCM token stored in user document
 */
type FCMToken = {
  token: string
  platform?: 'android' | 'ios' | 'web'
  lastUsed?: string
}

/**
 * Get users who should receive notifications based on notification type and role-based settings
 */
export async function getNotificationRecipients(
  payload: Payload,
  notificationType: NotificationType,
  notificationMethod: 'email' | 'push'
): Promise<{ user: User; sendEmail: boolean; sendPush: boolean }[]> {
  try {
    // Fetch notification settings for this notification type
    const { docs: settings } = await payload.find({
      collection: 'notification-settings',
      where: {
        notificationType: {
          equals: notificationType,
        },
      },
      limit: 1,
    })

    const setting = settings[0] as NotificationSetting | undefined

    if (!setting) {
      console.warn(`No notification settings found for ${notificationType}`)
      return []
    }

    // Determine which roles should receive this notification based on settings
    const rolesToNotify: Array<'admin-team' | 'content-team' | 'user'> = []

    if (notificationMethod === 'email') {
      if (setting.adminNotifications?.emailEnabled) rolesToNotify.push('admin-team')
      if (setting.contentTeamNotifications?.emailEnabled) rolesToNotify.push('content-team')
      if (setting.userNotifications?.emailEnabled) rolesToNotify.push('user')
    } else {
      if (setting.adminNotifications?.pushEnabled) rolesToNotify.push('admin-team')
      if (setting.contentTeamNotifications?.pushEnabled) rolesToNotify.push('content-team')
      if (setting.userNotifications?.pushEnabled) rolesToNotify.push('user')
    }

    if (rolesToNotify.length === 0) {
      console.log(`No roles enabled for ${notificationType} ${notificationMethod} notifications`)
      return []
    }

    // Query users with the required roles who are active and approved
    const { docs } = await payload.find({
      collection: 'users',
      where: {
        and: [
          {
            role: {
              in: rolesToNotify,
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
        ],
      },
      limit: 1000,
    })

    // Map users to notification preferences, respecting user overrides
    const recipients = docs.map((user: User) => {
      let sendEmail = false
      let sendPush = false

      // Check global settings for this user's role
      if (user.role === 'admin-team') {
        sendEmail = setting.adminNotifications?.emailEnabled || false
        sendPush = setting.adminNotifications?.pushEnabled || false
      } else if (user.role === 'content-team') {
        sendEmail = setting.contentTeamNotifications?.emailEnabled || false
        sendPush = setting.contentTeamNotifications?.pushEnabled || false
      } else if (user.role === 'user') {
        sendEmail = setting.userNotifications?.emailEnabled || false
        sendPush = setting.userNotifications?.pushEnabled || false
      }

      // User preferences override global settings
      // If user has disabled push notifications globally, respect that
      if (!user.pushNotificationsEnabled) {
        sendPush = false
      }

      // If user has disabled email notifications in their preferences, respect that
      if (!user.emailNotificationsEnabled) {
        sendEmail = false
      }

      return {
        user,
        sendEmail,
        sendPush,
      }
    })

    // Filter out users who shouldn't receive the requested notification method
    const filtered = recipients.filter(r =>
      notificationMethod === 'email' ? r.sendEmail : r.sendPush
    )

    console.log(`Found ${filtered.length} recipients for ${notificationType} ${notificationMethod} notifications`)
    return filtered
  } catch (error) {
    console.error(`Error fetching notification recipients:`, error)
    return []
  }
}

/**
 * Send notification to a single recipient and log it
 */
export async function sendAndLogNotification(payload: Payload, params: {
  type: Notification['type']
  recipient: string
  recipientUser?: User['id'] | User | null
  subject: string
  html: string
  relatedUser?: User['id'] | User | null
  relatedHospitalRequest?: HospitalChangeRequest['id'] | HospitalChangeRequest | null
  relatedBaseRequest?: BaseChangeRequest['id'] | BaseChangeRequest | null
  sendEmail?: boolean
  sendPushNotification?: boolean
  createdBy?: User['id'] | User | null
}): Promise<void> {
  const {
    type,
    recipient,
    recipientUser,
    subject,
    html,
    relatedUser,
    relatedHospitalRequest,
    relatedBaseRequest,
    sendEmail: sendEmailEnabled = true,
    sendPushNotification,
    createdBy,
  } = params

  const pushRecipientId = typeof recipientUser === 'object' ? recipientUser?.id : recipientUser
  const relatedUserId = typeof relatedUser === 'object' ? relatedUser?.id : relatedUser
  const relatedHospitalRequestId =
    typeof relatedHospitalRequest === 'object' ? relatedHospitalRequest?.id : relatedHospitalRequest
  const relatedBaseRequestId = typeof relatedBaseRequest === 'object' ? relatedBaseRequest?.id : relatedBaseRequest

  try {
    // Send the email
    const result = sendEmailEnabled
      ? await sendEmail({
          to: recipient,
          subject,
          html,
        })
      : { success: true, id: undefined, error: undefined }

    // Send push notification if requested and user has enabled it
    if (sendPushNotification && pushRecipientId) {
      // Build data object with only defined values (FCM requires Record<string, string>)
      const pushData: Record<string, string> = { type }
      if (relatedUserId) pushData.relatedUser = String(relatedUserId)
      if (relatedHospitalRequestId) pushData.relatedHospitalRequest = String(relatedHospitalRequestId)
      if (relatedBaseRequestId) pushData.relatedBaseRequest = String(relatedBaseRequestId)

      await sendPushNotificationToUser(payload, pushRecipientId, {
        title: subject,
        body: stripHtml(html).substring(0, 200), // First 200 chars without HTML
        data: pushData,
      })
    }

    // Log the notification in the database
    // Note: Payload's create function expects two generic params; rely on inference here
    await payload.create({
      collection: 'notifications',
      data: {
        type,
        recipient,
        recipientUser,
        subject,
        htmlContent: html,
        status: result.success ? 'sent' : 'failed',
        emailId: result.id,
        error: result.error,
        sentAt: result.success ? new Date().toISOString() : undefined,
        relatedUser,
        relatedHospitalRequest,
        relatedBaseRequest,
        createdBy,
      },
      overrideAccess: true, // Allow system to create notifications
    })

    if (sendEmailEnabled) {
      if (!result.success) {
        console.error(`Failed to send ${type} notification to ${recipient}:`, result.error)
      } else {
        console.log(`Successfully sent ${type} notification to ${recipient}`)
      }
    }
  } catch (error) {
    console.error(`Error sending and logging notification:`, error)

    // Still try to log the failed notification (use inference for Payload create generics)
    try {
      await payload.create({
        collection: 'notifications',
        data: {
          type,
          recipient,
          recipientUser,
          subject,
          htmlContent: html,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          relatedUser,
          relatedHospitalRequest,
          relatedBaseRequest,
          createdBy,
        },
        overrideAccess: true, // Allow system to create notifications
      })
    } catch (logError) {
      console.error('Failed to log notification error:', logError)
    }
  }
}

/**
 * Send notification based on role-based notification settings
 */
export async function sendNotificationByType(payload: Payload, params: {
  notificationType: NotificationType
  subject: string
  html: string
  relatedUser?: User['id'] | User | null
  relatedHospitalRequest?: HospitalChangeRequest['id'] | HospitalChangeRequest | null
  relatedBaseRequest?: BaseChangeRequest['id'] | BaseChangeRequest | null
  createdBy?: User['id'] | User | null
}): Promise<void> {
  const { notificationType, subject, html, relatedUser, relatedHospitalRequest, relatedBaseRequest, createdBy } = params

  try {
    // Get recipients for both email and push notifications
    const emailRecipients = await getNotificationRecipients(payload, notificationType, 'email')
    const pushRecipients = await getNotificationRecipients(payload, notificationType, 'push')

    // Combine recipients (some may receive both email and push)
    const allRecipients = new Map<string, { user: User; sendEmail: boolean; sendPush: boolean }>()

    for (const { user, sendEmail } of emailRecipients) {
      allRecipients.set(String(user.id), { user, sendEmail, sendPush: false })
    }

    for (const { user, sendPush } of pushRecipients) {
      const existing = allRecipients.get(String(user.id))
      if (existing) {
        existing.sendPush = sendPush
      } else {
        allRecipients.set(String(user.id), { user, sendEmail: false, sendPush })
      }
    }

    if (allRecipients.size === 0) {
      console.warn(`No recipients found for ${notificationType} notifications`)
      return
    }

    // Send notifications to each recipient
    for (const { user, sendEmail: shouldSendEmail, sendPush: shouldSendPush } of allRecipients.values()) {
      // Skip if no notification channels are enabled for this user
      if (!shouldSendEmail && !shouldSendPush) {
        continue
      }

      if (!user.email && shouldSendEmail) {
        console.warn(`Skipping user ${user.id} - no email address`)
        continue
      }

      // Map notification type to the type expected by Notification collection
      const notificationTypeForLog = notificationType as Notification['type']

      const recipientAddress = user.email || 'push-only'

      await sendAndLogNotification(payload, {
        type: notificationTypeForLog,
        recipient: recipientAddress,
        recipientUser: user.id,
        subject,
        html,
        relatedUser,
        relatedHospitalRequest,
        relatedBaseRequest,
        sendEmail: shouldSendEmail,
        sendPushNotification: shouldSendPush,
        createdBy,
      })
    }

    console.log(`Sent ${notificationType} notification to ${allRecipients.size} recipients`)
  } catch (error) {
    console.error(`Error sending notification by type:`, error)
  }
}

/**
 * Alias for backward compatibility - maps old notification types to new system
 * @deprecated Use sendNotificationByType instead
 */
export async function sendAndLogAdminNotification(payload: Payload, params: {
  type: Notification['type']
  subject: string
  html: string
  relatedUser?: User['id'] | User | null
  relatedHospitalRequest?: HospitalChangeRequest['id'] | HospitalChangeRequest | null
  relatedBaseRequest?: BaseChangeRequest['id'] | BaseChangeRequest | null
  createdBy?: User['id'] | User | null
}): Promise<void> {
  // Map old notification types to new NotificationType
  let notificationType: NotificationType = 'user_registers'

  // Handle legacy types
  if (params.type === 'user_registration_admin') {
    notificationType = 'user_registers'
  } else if (params.type === 'user_approved') {
    notificationType = 'user_approved'
  } else if (params.type === 'user_rejected') {
    notificationType = 'user_deactivated'
  } else if (params.type === 'hospital_request_submitted_admin') {
    notificationType = 'hospital_change_request_submitted'
  } else if (params.type === 'hospital_request_approved') {
    notificationType = 'request_approved'
  } else if (params.type === 'hospital_request_rejected') {
    notificationType = 'request_denied'
  } else if (params.type === 'base_request_submitted_admin') {
    notificationType = 'base_change_request_submitted'
  } else if (params.type === 'base_request_approved') {
    notificationType = 'request_approved'
  } else if (params.type === 'base_request_rejected') {
    notificationType = 'request_denied'
  }
  // Handle new types directly
  else if (params.type === 'user_registers') {
    notificationType = 'user_registers'
  } else if (params.type === 'user_deactivated') {
    notificationType = 'user_deactivated'
  } else if (params.type === 'user_deleted') {
    notificationType = 'user_deleted'
  } else if (params.type === 'base_change_request_submitted') {
    notificationType = 'base_change_request_submitted'
  } else if (params.type === 'hospital_change_request_submitted') {
    notificationType = 'hospital_change_request_submitted'
  } else if (params.type === 'new_base_submitted') {
    notificationType = 'new_base_submitted'
  } else if (params.type === 'new_hospital_submitted') {
    notificationType = 'new_hospital_submitted'
  } else if (params.type === 'request_approved') {
    notificationType = 'request_approved'
  } else if (params.type === 'request_denied') {
    notificationType = 'request_denied'
  }

  await sendNotificationByType(payload, {
    notificationType,
    subject: params.subject,
    html: params.html,
    relatedUser: params.relatedUser,
    relatedHospitalRequest: params.relatedHospitalRequest,
    relatedBaseRequest: params.relatedBaseRequest,
    createdBy: params.createdBy,
  })
}

/**
 * Log an audit trail entry
 */
export async function logAuditTrail(payload: Payload, params: {
  action: AuditLog['action']
  collection: AuditLog['collection']
  documentId: string | number
  changedBy: User['id'] | User
  changes?: Array<{
    field: string
    previousValue?: string
    newValue?: string
  }>
  metadata?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}): Promise<void> {
  const { action, collection, documentId, changedBy, changes, metadata, ipAddress, userAgent } = params

  try {
    await payload.create({
      collection: 'audit-log',
      data: {
        action,
        collection,
        documentId: String(documentId),
        changedBy,
        changes: changes || [],
        metadata,
        ipAddress,
        userAgent,
      },
      overrideAccess: true, // Allow system to create audit logs
    })

    console.log(`Audit log created: ${action} on ${collection}/${documentId}`)
  } catch (error) {
    console.error('Failed to create audit log entry:', error)
  }
}

/**
 * Compare two objects and generate a list of field changes
 */
export function detectChanges(
  previousData: Record<string, unknown>,
  newData: Record<string, unknown>,
  fieldsToCompare: string[]
): Array<{ field: string; previousValue: string; newValue: string }> {
  const changes: Array<{ field: string; previousValue: string; newValue: string }> = []

  for (const field of fieldsToCompare) {
    const prevValue = previousData[field]
    const newValue = newData[field]

    // Simple comparison (stringify for complex objects)
    const prevStr = typeof prevValue === 'object' ? JSON.stringify(prevValue) : String(prevValue ?? '')
    const newStr = typeof newValue === 'object' ? JSON.stringify(newValue) : String(newValue ?? '')

    if (prevStr !== newStr) {
      changes.push({
        field,
        previousValue: prevStr,
        newValue: newStr,
      })
    }
  }

  return changes
}

/**
 * Strip HTML tags from a string
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}

/**
 * Initialize Firebase Admin SDK for push notifications
 * Uses HTTP v1 API (legacy FCM API deprecated 6/20/2024)
 *
 * Supports two configuration methods:
 * 1. GOOGLE_APPLICATION_CREDENTIALS env var pointing to JSON file (recommended)
 * 2. Individual FCM_PROJECT_ID, FCM_PRIVATE_KEY, FCM_CLIENT_EMAIL env vars
 */
let firebaseInitialized = false

async function initializeFirebaseAdmin(): Promise<typeof admin | null> {
  console.log('[Firebase Init] Starting Firebase Admin SDK initialization...')

  if (firebaseInitialized) {
    console.log('[Firebase Init] Already initialized, returning existing instance')
    return admin
  }

  try {
    if (admin.apps.length > 0) {
      console.log('[Firebase Init] Firebase app already exists')
      firebaseInitialized = true
      return admin
    }

    // Method 1 (Recommended): Use GOOGLE_APPLICATION_CREDENTIALS
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
    console.log('[Firebase Init] GOOGLE_APPLICATION_CREDENTIALS:', credentialsPath || 'NOT SET')

    if (credentialsPath) {
      console.log('[Firebase Init] Attempting to initialize with GOOGLE_APPLICATION_CREDENTIALS...')
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: process.env.FCM_PROJECT_ID,
      })
      firebaseInitialized = true
      console.log('✅ Firebase Admin SDK initialized successfully (using GOOGLE_APPLICATION_CREDENTIALS)')
      return admin
    }

    // Method 2 (Fallback): Use individual credentials
    const projectId = process.env.FCM_PROJECT_ID
    const privateKey = process.env.FCM_PRIVATE_KEY
    const clientEmail = process.env.FCM_CLIENT_EMAIL
    console.log('[Firebase Init] Method 2 - FCM_PROJECT_ID:', projectId || 'NOT SET')
    console.log('[Firebase Init] Method 2 - FCM_CLIENT_EMAIL:', clientEmail || 'NOT SET')
    console.log('[Firebase Init] Method 2 - FCM_PRIVATE_KEY:', privateKey ? 'SET' : 'NOT SET')

    if (projectId && privateKey && clientEmail) {
      console.log('[Firebase Init] Attempting to initialize with individual credentials...')
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          privateKey: privateKey.replace(/\\n/g, '\n'), // Handle escaped newlines
          clientEmail,
        }),
      })
      firebaseInitialized = true
      console.log('✅ Firebase Admin SDK initialized successfully (using individual credentials)')
      return admin
    }

    // No credentials configured
    console.error('❌ Firebase credentials not configured - push notifications will be disabled')
    console.error('❌ Configure either GOOGLE_APPLICATION_CREDENTIALS or FCM_PROJECT_ID/FCM_PRIVATE_KEY/FCM_CLIENT_EMAIL')
    return null
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error)
    if (error instanceof Error) {
      console.error('❌ Error message:', error.message)
      console.error('❌ Error stack:', error.stack)
    }
    return null
  }
}

/**
 * Send push notification to a user via FCM (Firebase Cloud Messaging)
 * Uses Firebase Admin SDK with HTTP v1 API
 */
export async function sendPushNotificationToUser(
  payload: Payload,
  userId: string | number,
  notification: {
    title: string
    body: string
    data?: Record<string, string>
  }
): Promise<void> {
  console.log(`[Push Notification] Attempting to send push to user ${userId}:`, notification.title)

  try {
    // Fetch user to check if push notifications are enabled and get FCM tokens
    const user = await payload.findByID({
      collection: 'users',
      id: userId,
    })

    console.log(`[Push Notification] User ${userId} found, pushNotificationsEnabled:`, user.pushNotificationsEnabled)

    if (!user.pushNotificationsEnabled) {
      console.log(`[Push Notification] Push notifications disabled for user ${userId}`)
      return
    }

    const fcmTokens = (user.fcmTokens || []) as FCMToken[]
    console.log(`[Push Notification] User ${userId} has ${fcmTokens.length} FCM token(s)`)

    if (fcmTokens.length === 0) {
      console.log(`[Push Notification] No FCM tokens found for user ${userId}`)
      return
    }

    // Initialize Firebase Admin if needed
    console.log('[Push Notification] Initializing Firebase Admin SDK...')
    const admin = await initializeFirebaseAdmin()

    if (!admin) {
      const errorMsg = 'Firebase Admin SDK not initialized - push notifications disabled. Check Firebase credentials (GOOGLE_APPLICATION_CREDENTIALS or FCM_PROJECT_ID/FCM_PRIVATE_KEY/FCM_CLIENT_EMAIL)'
      console.error(`[Push Notification] ❌ ${errorMsg}`)
      throw new Error(errorMsg)
    }

    console.log('[Push Notification] Firebase Admin SDK ready, proceeding to send...')

    // Send push notification using Firebase Admin SDK (HTTP v1 API)
    const messaging = admin.messaging()
    const tokens = fcmTokens.map((t) => t.token)

    console.log(`Attempting to send push notification to user ${userId} with ${tokens.length} FCM token(s)`)

    const response = await messaging.sendEachForMulticast({
      tokens,
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: notification.data || {},
      android: {
        priority: 'high' as const,
      },
      apns: {
        headers: {
          'apns-priority': '10',
        },
        payload: {
          aps: {
            sound: 'default',
          },
        },
      },
    })

    console.log(`Push notification sent to ${response.successCount}/${tokens.length} devices`)

    // Remove invalid tokens (expired, unregistered, or invalid)
    if (response.failureCount > 0) {
      const validTokens = fcmTokens.filter((_token, index) => {
        const result = response.responses[index]
        if (!result.success) {
          // Log the specific error for debugging
          console.warn(`Failed to send to token ${index}:`, result.error?.code, result.error?.message)
        }
        return result.success
      })

      if (validTokens.length < fcmTokens.length) {
        await payload.update({
          collection: 'users',
          id: userId,
          data: {
            fcmTokens: validTokens,
          },
        })
        console.log(`Removed ${fcmTokens.length - validTokens.length} invalid FCM tokens for user ${userId}`)
      }
    }

    // If all tokens failed, throw an error
    if (response.successCount === 0) {
      const firstError = response.responses[0]?.error
      throw new Error(`Failed to send push notification to any device. Error: ${firstError?.code} - ${firstError?.message}`)
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : ''
    console.error(`Error sending push notification to user ${userId}:`, errorMessage)
    if (errorStack) {
      console.error('Stack trace:', errorStack)
    }
    // Re-throw to allow caller to handle
    throw error
  }
}
