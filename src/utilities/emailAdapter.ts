import type { EmailAdapter, SendEmailOptions } from 'payload'
import { Resend } from 'resend'

/**
 * Resend Email Adapter for Payload CMS
 * Uses Resend API to send transactional emails
 */
export const resendAdapter = (): EmailAdapter => {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const defaultFromAddress = process.env.FROM_EMAIL || 'noreply@ping.acmc.app'
  const defaultFromName = process.env.FROM_NAME || 'Air Care & Mobile Care'

  return {
    defaultFromAddress,
    defaultFromName,
    sendEmail: async (message: SendEmailOptions) => {
      try {
        // Validate API key
        if (!process.env.RESEND_API_KEY) {
          console.error('RESEND_API_KEY environment variable is not set')
          throw new Error('Email service not configured. Please set RESEND_API_KEY.')
        }

        // Extract email options
        const { to, from, subject, html, text } = message

        // Determine from address
        const fromAddress = from || defaultFromAddress
        const fromName = defaultFromName

        // Send email via Resend
        const result = await resend.emails.send({
          from: `${fromName} <${fromAddress}>`,
          to: Array.isArray(to) ? to : [to],
          subject,
          html: html || text || '',
          ...(text && { text }),
        })

        if (result.error) {
          console.error('Resend API error:', result.error)
          throw new Error(result.error.message)
        }

        console.log('Email sent successfully via Resend:', result.data?.id)
        return result
      } catch (error) {
        console.error('Failed to send email:', error)
        throw error
      }
    },
  }
}
