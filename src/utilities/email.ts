import { Resend } from 'resend'

export interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  from?: string
}

/**
 * Send an email using Resend
 * @param options Email options (to, subject, html, from)
 * @returns Promise with email ID if successful
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    // Validate API key exists
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured')
      return { success: false, error: 'Email service not configured' }
    }

    // Set default from address
    const from = options.from || process.env.FROM_EMAIL || 'onboarding@resend.dev'
    const fromName = process.env.FROM_NAME || 'Air Care & Mobile Care'

    const resend = new Resend(process.env.RESEND_API_KEY)

    const result = await resend.emails.send({
      from: `${fromName} <${from}>`,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
    })

    if (result.error) {
      console.error('Failed to send email:', result.error)
      return { success: false, error: result.error.message }
    }

    console.log('Email sent successfully:', result.data?.id)
    return { success: true, id: result.data?.id || undefined }
  } catch (error) {
    console.error('Error sending email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Send email to admin notification address
 * @param subject Email subject
 * @param html Email HTML content
 * @returns Promise with email ID if successful
 */
export async function sendAdminNotification(
  subject: string,
  html: string,
): Promise<{ success: boolean; id?: string; error?: string }> {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL

  if (!adminEmail) {
    console.warn('ADMIN_NOTIFICATION_EMAIL is not configured, skipping admin notification')
    return { success: false, error: 'Admin email not configured' }
  }

  return sendEmail({
    to: adminEmail,
    subject,
    html,
  })
}
