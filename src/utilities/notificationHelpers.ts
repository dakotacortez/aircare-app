import type { Payload } from 'payload'
import { sendEmail } from './email'
import type { User } from '@/payload-types'
import type admin from 'firebase-admin'

/**
 * Notification category types that map to user notification preferences
 */
export type NotificationCategory = 'userRegistrations' | 'changeRequests' | 'systemNotifications'

/**
 * Type for FCM token stored in user document
 */
type FCMToken = {
  token: string
  platform?: 'android' | 'ios' | 'web'
  lastUsed?: string
}

/**
 * Get users who should receive notifications based on role and preferences
 */
export async function getNotificationRecipients(
  payload: Payload,
  category: NotificationCategory,
  requiredRoles: Array<'admin-team' | 'content-team'> = ['admin-team', 'content-team']
): Promise<User[]> {
  try {
    // Query users with the required roles who are active and approved
    const { docs } = await payload.find({
      collection: 'users',
      where: {
        and: [
          {
            role: {
              in: requiredRoles,
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
      limit: 1000, // Get all eligible users
    })

    // Filter by notification preferences
    // Users opt-in by default, so only exclude if explicitly set to false
    const recipients = docs.filter((user: User) => {
      const prefs = user.notificationPreferences
      if (!prefs) return true // If no preferences set, opt-in by default

      // Check category-specific preference
      const categoryPref = prefs[category]
      return categoryPref !== false // Include if true or undefined (default opt-in)
    })

    console.log(`Found ${recipients.length} recipients for ${category} notifications`)
    return recipients
  } catch (error) {
    console.error(`Error fetching notification recipients:`, error)
    return []
  }
}

/**
 * Send notification to a single recipient and log it
 */
export async function sendAndLogNotification(payload: Payload, params: {
  type: string
  recipient: string
  recipientUser?: string | number | null
  subject: string
  html: string
  relatedUser?: string | number | null
  relatedHospitalRequest?: string | number | null
  relatedBaseRequest?: string | number | null
  sendPushNotification?: boolean
}): Promise<void> {
  const { type, recipient, recipientUser, subject, html, relatedUser, relatedHospitalRequest, relatedBaseRequest, sendPushNotification } = params

  try {
    // Send the email
    const result = await sendEmail({
      to: recipient,
      subject,
      html,
    })

    // Send push notification if requested and user has enabled it
    if (sendPushNotification && recipientUser) {
      await sendPushNotificationToUser(payload, recipientUser, {
        title: subject,
        body: stripHtml(html).substring(0, 200), // First 200 chars without HTML
        data: {
          type,
          relatedUser: relatedUser?.toString(),
          relatedHospitalRequest: relatedHospitalRequest?.toString(),
          relatedBaseRequest: relatedBaseRequest?.toString(),
        },
      })
    }

    // Log the notification in the database
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
      },
    })

    if (!result.success) {
      console.error(`Failed to send ${type} notification to ${recipient}:`, result.error)
    } else {
      console.log(`Successfully sent ${type} notification to ${recipient}`)
    }
  } catch (error) {
    console.error(`Error sending and logging notification:`, error)

    // Still try to log the failed notification
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
        },
      })
    } catch (logError) {
      console.error('Failed to log notification error:', logError)
    }
  }
}

/**
 * Send team notification to admin/content team members based on their preferences
 */
export async function sendAndLogTeamNotification(payload: Payload, params: {
  type: string
  category: NotificationCategory
  subject: string
  html: string
  requiredRoles?: Array<'admin-team' | 'content-team'>
  relatedUser?: string | number | null
  relatedHospitalRequest?: string | number | null
  relatedBaseRequest?: string | number | null
  sendPushNotification?: boolean
}): Promise<void> {
  const { type, category, subject, html, requiredRoles = ['admin-team', 'content-team'], relatedUser, relatedHospitalRequest, relatedBaseRequest, sendPushNotification } = params

  try {
    // Get all eligible recipients based on role and preferences
    const recipients = await getNotificationRecipients(payload, category, requiredRoles)

    if (recipients.length === 0) {
      console.warn(`No recipients found for ${category} notifications`)
      return
    }

    // Send notification to each recipient
    for (const recipient of recipients) {
      if (!recipient.email) {
        console.warn(`Skipping user ${recipient.id} - no email address`)
        continue
      }

      await sendAndLogNotification(payload, {
        type,
        recipient: recipient.email,
        recipientUser: recipient.id,
        subject,
        html,
        relatedUser,
        relatedHospitalRequest,
        relatedBaseRequest,
        sendPushNotification,
      })
    }

    console.log(`Sent ${category} notification to ${recipients.length} team members`)
  } catch (error) {
    console.error(`Error sending team notification:`, error)
  }
}

/**
 * Alias for backward compatibility - send to admin/content team for user registrations
 */
export async function sendAndLogAdminNotification(payload: Payload, params: {
  type: string
  subject: string
  html: string
  relatedUser?: string | number | null
  relatedHospitalRequest?: string | number | null
  relatedBaseRequest?: string | number | null
}): Promise<void> {
  // Determine category based on type
  let category: NotificationCategory = 'systemNotifications'
  let requiredRoles: Array<'admin-team' | 'content-team'> = ['admin-team', 'content-team']

  if (params.type.includes('user_registration')) {
    category = 'userRegistrations'
  } else if (params.type.includes('request')) {
    category = 'changeRequests'
  } else if (params.type.includes('system')) {
    category = 'systemNotifications'
    requiredRoles = ['admin-team'] // Only admins get system notifications
  }

  await sendAndLogTeamNotification(payload, {
    ...params,
    category,
    requiredRoles,
  })
}

/**
 * Log an audit trail entry
 */
export async function logAuditTrail(payload: Payload, params: {
  action: 'created' | 'updated' | 'approved' | 'rejected' | 'amended' | 'status_changed'
  collection: 'users' | 'hospital-change-requests' | 'base-change-requests' | 'hospitals' | 'bases'
  documentId: string | number
  changedBy: string | number
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
let firebaseAdmin: typeof admin | null = null

async function initializeFirebaseAdmin(): Promise<typeof admin | null> {
  if (firebaseInitialized && firebaseAdmin) return firebaseAdmin

  try {
    // Dynamic import to avoid issues if firebase-admin is not installed
    const adminModule = await import('firebase-admin')
    firebaseAdmin = adminModule.default

    if (firebaseAdmin.apps.length > 0) {
      firebaseInitialized = true
      return firebaseAdmin
    }

    // Method 1 (Recommended): Use GOOGLE_APPLICATION_CREDENTIALS
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS

    if (credentialsPath) {
      firebaseAdmin.initializeApp({
        credential: firebaseAdmin.credential.applicationDefault(),
        projectId: process.env.FCM_PROJECT_ID,
      })
      firebaseInitialized = true
      console.log('Firebase Admin SDK initialized successfully (using GOOGLE_APPLICATION_CREDENTIALS)')
      return firebaseAdmin
    }

    // Method 2 (Fallback): Use individual credentials
    const projectId = process.env.FCM_PROJECT_ID
    const privateKey = process.env.FCM_PRIVATE_KEY
    const clientEmail = process.env.FCM_CLIENT_EMAIL

    if (projectId && privateKey && clientEmail) {
      firebaseAdmin.initializeApp({
        credential: firebaseAdmin.credential.cert({
          projectId,
          privateKey: privateKey.replace(/\\n/g, '\n'), // Handle escaped newlines
          clientEmail,
        }),
      })
      firebaseInitialized = true
      console.log('Firebase Admin SDK initialized successfully (using individual credentials)')
      return firebaseAdmin
    }

    // No credentials configured
    console.warn('Firebase credentials not configured - push notifications will be disabled')
    console.warn('Configure either GOOGLE_APPLICATION_CREDENTIALS or FCM_PROJECT_ID/FCM_PRIVATE_KEY/FCM_CLIENT_EMAIL')
    return null
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error)
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
  try {
    // Fetch user to check if push notifications are enabled and get FCM tokens
    const user = await payload.findByID({
      collection: 'users',
      id: userId,
    })

    if (!user.pushNotificationsEnabled) {
      console.log(`Push notifications disabled for user ${userId}`)
      return
    }

    const fcmTokens = (user.fcmTokens || []) as FCMToken[]
    if (fcmTokens.length === 0) {
      console.log(`No FCM tokens found for user ${userId}`)
      return
    }

    // Initialize Firebase Admin if needed
    const admin = await initializeFirebaseAdmin()

    if (!admin) {
      console.warn('Firebase Admin SDK not initialized - skipping push notification')
      return
    }

    // Send push notification using Firebase Admin SDK (HTTP v1 API)
    const messaging = admin.messaging()
    const tokens = fcmTokens.map((t) => t.token)

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
          console.warn(`Failed to send to token ${index}:`, result.error?.code)
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
  } catch (error) {
    console.error(`Error sending push notification to user ${userId}:`, error)
  }
}
