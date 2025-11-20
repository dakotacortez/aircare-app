import type { Payload } from 'payload'
import { sendEmail, sendAdminNotification } from './email'
import type { User } from '@/payload-types'

/**
 * Send notification and log it in the Notifications collection
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
}): Promise<void> {
  const { type, recipient, recipientUser, subject, html, relatedUser, relatedHospitalRequest, relatedBaseRequest } = params

  try {
    // Send the email
    const result = await sendEmail({
      to: recipient,
      subject,
      html,
    })

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
 * Send admin notification and log it
 */
export async function sendAndLogAdminNotification(payload: Payload, params: {
  type: string
  subject: string
  html: string
  relatedUser?: string | number | null
  relatedHospitalRequest?: string | number | null
  relatedBaseRequest?: string | number | null
}): Promise<void> {
  const { type, subject, html, relatedUser, relatedHospitalRequest, relatedBaseRequest } = params
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL

  if (!adminEmail) {
    console.warn('ADMIN_NOTIFICATION_EMAIL not configured, skipping admin notification')
    return
  }

  try {
    // Send the email
    const result = await sendAdminNotification(subject, html)

    // Log the notification in the database
    await payload.create({
      collection: 'notifications',
      data: {
        type,
        recipient: adminEmail,
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
      console.error(`Failed to send admin notification:`, result.error)
    } else {
      console.log(`Successfully sent admin notification`)
    }
  } catch (error) {
    console.error(`Error sending and logging admin notification:`, error)

    // Still try to log the failed notification
    try {
      await payload.create({
        collection: 'notifications',
        data: {
          type,
          recipient: adminEmail,
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
      console.error('Failed to log admin notification error:', logError)
    }
  }
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
  metadata?: Record<string, any>
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
  previousData: Record<string, any>,
  newData: Record<string, any>,
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
