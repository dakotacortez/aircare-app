/**
 * Email template utilities for all notification types
 */

const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

/**
 * Base email wrapper with consistent styling
 */
function wrapEmail(content: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Air Care & Mobile Care</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">Air Care & Mobile Care</h1>
                </td>
              </tr>
              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  ${content}
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="padding: 20px 30px; background-color: #f9fafb; border-radius: 0 0 8px 8px; text-align: center; color: #6b7280; font-size: 14px;">
                  <p style="margin: 0 0 10px 0;">Air Care & Mobile Care</p>
                  <p style="margin: 0; font-size: 12px;">
                    <a href="${baseUrl}" style="color: #667eea; text-decoration: none;">Visit Website</a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}

// ============================================================
// USER REGISTRATION NOTIFICATIONS
// ============================================================

/**
 * Email to admin when a new user registers
 */
export function newUserRegistrationAdminEmail(user: {
  name?: string | null
  email?: string | null
  id: string | number
}): { subject: string; html: string } {
  const userName = user.name || user.email || 'Unknown User'
  const reviewUrl = `${baseUrl}/admin/collections/users/${user.id}`

  const content = `
    <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 20px;">New User Registration</h2>
    <p style="margin: 0 0 15px 0; color: #374151; font-size: 16px; line-height: 1.5;">
      A new user has registered and is awaiting approval:
    </p>
    <div style="background-color: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0; color: #1f2937;"><strong>Name:</strong> ${userName}</p>
      <p style="margin: 0; color: #1f2937;"><strong>Email:</strong> ${user.email || 'N/A'}</p>
    </div>
    <p style="margin: 20px 0 0 0; color: #374151; font-size: 16px; line-height: 1.5;">
      Please review and approve or reject this user registration.
    </p>
    <div style="text-align: center; margin-top: 30px;">
      <a href="${reviewUrl}" style="display: inline-block; background-color: #667eea; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600;">
        Review User
      </a>
    </div>
  `

  return {
    subject: `New User Registration: ${userName}`,
    html: wrapEmail(content),
  }
}

/**
 * Email to user when their account is approved
 */
export function userApprovedEmail(user: {
  name?: string | null
  email?: string | null
}): { subject: string; html: string } {
  const userName = user.name || user.email || 'there'
  const loginUrl = `${baseUrl}/login`

  const content = `
    <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 20px;">Account Approved!</h2>
    <p style="margin: 0 0 15px 0; color: #374151; font-size: 16px; line-height: 1.5;">
      Hi ${userName},
    </p>
    <p style="margin: 0 0 15px 0; color: #374151; font-size: 16px; line-height: 1.5;">
      Great news! Your account has been approved and is now active.
    </p>
    <p style="margin: 0 0 15px 0; color: #374151; font-size: 16px; line-height: 1.5;">
      You can now log in and access all features of Air Care & Mobile Care.
    </p>
    <div style="text-align: center; margin-top: 30px;">
      <a href="${loginUrl}" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600;">
        Log In Now
      </a>
    </div>
  `

  return {
    subject: 'Your Account Has Been Approved',
    html: wrapEmail(content),
  }
}

/**
 * Email to user when their account is rejected
 */
export function userRejectedEmail(user: {
  name?: string | null
  email?: string | null
}, reason?: string): { subject: string; html: string } {
  const userName = user.name || user.email || 'there'

  const content = `
    <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 20px;">Account Registration Update</h2>
    <p style="margin: 0 0 15px 0; color: #374151; font-size: 16px; line-height: 1.5;">
      Hi ${userName},
    </p>
    <p style="margin: 0 0 15px 0; color: #374151; font-size: 16px; line-height: 1.5;">
      Thank you for your interest in Air Care & Mobile Care. Unfortunately, we are unable to approve your account at this time.
    </p>
    ${reason ? `
      <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; color: #991b1b; font-size: 14px;"><strong>Reason:</strong></p>
        <p style="margin: 5px 0 0 0; color: #991b1b; font-size: 14px;">${reason}</p>
      </div>
    ` : ''}
    <p style="margin: 20px 0 0 0; color: #374151; font-size: 16px; line-height: 1.5;">
      If you have any questions, please contact our support team.
    </p>
  `

  return {
    subject: 'Account Registration Update',
    html: wrapEmail(content),
  }
}

// ============================================================
// HOSPITAL CHANGE REQUEST NOTIFICATIONS
// ============================================================

/**
 * Email to admin when a new hospital change request is submitted
 */
export function hospitalChangeRequestSubmittedAdminEmail(request: {
  id: string | number
  type: 'add' | 'update'
  submittedBy?: { name?: string | null; email?: string | null } | string | number
  proposedData?: { name?: string }
  targetHospital?: { name?: string } | string | number
}): { subject: string; html: string } {
  const submitterName = typeof request.submittedBy === 'object' && request.submittedBy
    ? request.submittedBy.name || request.submittedBy.email || 'Unknown User'
    : 'Unknown User'

  const hospitalName = request.type === 'add'
    ? request.proposedData?.name || 'New Hospital'
    : typeof request.targetHospital === 'object' && request.targetHospital
      ? request.targetHospital.name || 'Unknown Hospital'
      : 'Unknown Hospital'

  const requestType = request.type === 'add' ? 'New Hospital Submission' : 'Hospital Update Request'
  const reviewUrl = `${baseUrl}/admin/collections/hospital-change-requests/${request.id}`

  const content = `
    <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 20px;">${requestType}</h2>
    <p style="margin: 0 0 15px 0; color: #374151; font-size: 16px; line-height: 1.5;">
      A ${request.type === 'add' ? 'new hospital has been submitted' : 'hospital update request has been submitted'} and is awaiting review:
    </p>
    <div style="background-color: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0; color: #1f2937;"><strong>Type:</strong> ${requestType}</p>
      <p style="margin: 0 0 10px 0; color: #1f2937;"><strong>Hospital:</strong> ${hospitalName}</p>
      <p style="margin: 0; color: #1f2937;"><strong>Submitted By:</strong> ${submitterName}</p>
    </div>
    <p style="margin: 20px 0 0 0; color: #374151; font-size: 16px; line-height: 1.5;">
      Please review and approve, amend, or reject this change request.
    </p>
    <div style="text-align: center; margin-top: 30px;">
      <a href="${reviewUrl}" style="display: inline-block; background-color: #667eea; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600;">
        Review Request
      </a>
    </div>
  `

  return {
    subject: `${requestType}: ${hospitalName}`,
    html: wrapEmail(content),
  }
}

/**
 * Email to user when their hospital change request is approved
 */
export function hospitalChangeRequestApprovedEmail(
  userEmail: string,
  userName: string | null | undefined,
  request: {
    type: 'add' | 'update'
    proposedData?: { name?: string }
    targetHospital?: { name?: string } | string | number
  }
): { subject: string; html: string } {
  const displayName = userName || userEmail || 'there'
  const hospitalName = request.type === 'add'
    ? request.proposedData?.name || 'the hospital'
    : typeof request.targetHospital === 'object' && request.targetHospital
      ? request.targetHospital.name || 'the hospital'
      : 'the hospital'

  const action = request.type === 'add' ? 'submission has been approved and published' : 'update has been approved and is now live'

  const content = `
    <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 20px;">Change Request Approved!</h2>
    <p style="margin: 0 0 15px 0; color: #374151; font-size: 16px; line-height: 1.5;">
      Hi ${displayName},
    </p>
    <p style="margin: 0 0 15px 0; color: #374151; font-size: 16px; line-height: 1.5;">
      Great news! Your ${request.type === 'add' ? 'hospital submission' : 'hospital update request'} for <strong>${hospitalName}</strong> has been approved.
    </p>
    <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; color: #065f46; font-size: 14px;">
        ✓ Your ${action}
      </p>
    </div>
    <p style="margin: 20px 0 0 0; color: #374151; font-size: 16px; line-height: 1.5;">
      Thank you for contributing to Air Care & Mobile Care!
    </p>
  `

  return {
    subject: `Hospital ${request.type === 'add' ? 'Submission' : 'Update'} Approved: ${hospitalName}`,
    html: wrapEmail(content),
  }
}

/**
 * Email to user when their hospital change request is rejected
 */
export function hospitalChangeRequestRejectedEmail(
  userEmail: string,
  userName: string | null | undefined,
  request: {
    type: 'add' | 'update'
    proposedData?: { name?: string }
    targetHospital?: { name?: string } | string | number
  },
  rejectionReason?: string
): { subject: string; html: string } {
  const displayName = userName || userEmail || 'there'
  const hospitalName = request.type === 'add'
    ? request.proposedData?.name || 'the hospital'
    : typeof request.targetHospital === 'object' && request.targetHospital
      ? request.targetHospital.name || 'the hospital'
      : 'the hospital'

  const content = `
    <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 20px;">Change Request Update</h2>
    <p style="margin: 0 0 15px 0; color: #374151; font-size: 16px; line-height: 1.5;">
      Hi ${displayName},
    </p>
    <p style="margin: 0 0 15px 0; color: #374151; font-size: 16px; line-height: 1.5;">
      Thank you for your ${request.type === 'add' ? 'hospital submission' : 'hospital update request'} for <strong>${hospitalName}</strong>.
    </p>
    <p style="margin: 0 0 15px 0; color: #374151; font-size: 16px; line-height: 1.5;">
      After review, we are unable to approve this request at this time.
    </p>
    ${rejectionReason ? `
      <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; color: #991b1b; font-size: 14px;"><strong>Reason:</strong></p>
        <p style="margin: 5px 0 0 0; color: #991b1b; font-size: 14px;">${rejectionReason}</p>
      </div>
    ` : ''}
    <p style="margin: 20px 0 0 0; color: #374151; font-size: 16px; line-height: 1.5;">
      If you have questions or would like to submit a revised request, please contact our team.
    </p>
  `

  return {
    subject: `Hospital ${request.type === 'add' ? 'Submission' : 'Update'} Review: ${hospitalName}`,
    html: wrapEmail(content),
  }
}

// ============================================================
// BASE CHANGE REQUEST NOTIFICATIONS (same pattern as hospitals)
// ============================================================

/**
 * Email to admin when a new base change request is submitted
 */
export function baseChangeRequestSubmittedAdminEmail(request: {
  id: string | number
  type: 'add' | 'update'
  submittedBy?: { name?: string | null; email?: string | null } | string | number
  proposedData?: { name?: string }
  targetBase?: { name?: string } | string | number
}): { subject: string; html: string } {
  const submitterName = typeof request.submittedBy === 'object' && request.submittedBy
    ? request.submittedBy.name || request.submittedBy.email || 'Unknown User'
    : 'Unknown User'

  const baseName = request.type === 'add'
    ? request.proposedData?.name || 'New Base'
    : typeof request.targetBase === 'object' && request.targetBase
      ? request.targetBase.name || 'Unknown Base'
      : 'Unknown Base'

  const requestType = request.type === 'add' ? 'New Base Submission' : 'Base Update Request'
  const reviewUrl = `${baseUrl}/admin/collections/base-change-requests/${request.id}`

  const content = `
    <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 20px;">${requestType}</h2>
    <p style="margin: 0 0 15px 0; color: #374151; font-size: 16px; line-height: 1.5;">
      A ${request.type === 'add' ? 'new base has been submitted' : 'base update request has been submitted'} and is awaiting review:
    </p>
    <div style="background-color: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0; color: #1f2937;"><strong>Type:</strong> ${requestType}</p>
      <p style="margin: 0 0 10px 0; color: #1f2937;"><strong>Base:</strong> ${baseName}</p>
      <p style="margin: 0; color: #1f2937;"><strong>Submitted By:</strong> ${submitterName}</p>
    </div>
    <p style="margin: 20px 0 0 0; color: #374151; font-size: 16px; line-height: 1.5;">
      Please review and approve, amend, or reject this change request.
    </p>
    <div style="text-align: center; margin-top: 30px;">
      <a href="${reviewUrl}" style="display: inline-block; background-color: #667eea; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600;">
        Review Request
      </a>
    </div>
  `

  return {
    subject: `${requestType}: ${baseName}`,
    html: wrapEmail(content),
  }
}

export function baseChangeRequestApprovedEmail(
  userEmail: string,
  userName: string | null | undefined,
  request: {
    type: 'add' | 'update'
    proposedData?: { name?: string }
    targetBase?: { name?: string } | string | number
  }
): { subject: string; html: string } {
  const displayName = userName || userEmail || 'there'
  const baseName = request.type === 'add'
    ? request.proposedData?.name || 'the base'
    : typeof request.targetBase === 'object' && request.targetBase
      ? request.targetBase.name || 'the base'
      : 'the base'

  const action = request.type === 'add' ? 'submission has been approved and published' : 'update has been approved and is now live'

  const content = `
    <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 20px;">Change Request Approved!</h2>
    <p style="margin: 0 0 15px 0; color: #374151; font-size: 16px; line-height: 1.5;">
      Hi ${displayName},
    </p>
    <p style="margin: 0 0 15px 0; color: #374151; font-size: 16px; line-height: 1.5;">
      Great news! Your ${request.type === 'add' ? 'base submission' : 'base update request'} for <strong>${baseName}</strong> has been approved.
    </p>
    <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; color: #065f46; font-size: 14px;">
        ✓ Your ${action}
      </p>
    </div>
    <p style="margin: 20px 0 0 0; color: #374151; font-size: 16px; line-height: 1.5;">
      Thank you for contributing to Air Care & Mobile Care!
    </p>
  `

  return {
    subject: `Base ${request.type === 'add' ? 'Submission' : 'Update'} Approved: ${baseName}`,
    html: wrapEmail(content),
  }
}

export function baseChangeRequestRejectedEmail(
  userEmail: string,
  userName: string | null | undefined,
  request: {
    type: 'add' | 'update'
    proposedData?: { name?: string }
    targetBase?: { name?: string } | string | number
  },
  rejectionReason?: string
): { subject: string; html: string } {
  const displayName = userName || userEmail || 'there'
  const baseName = request.type === 'add'
    ? request.proposedData?.name || 'the base'
    : typeof request.targetBase === 'object' && request.targetBase
      ? request.targetBase.name || 'the base'
      : 'the base'

  const content = `
    <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 20px;">Change Request Update</h2>
    <p style="margin: 0 0 15px 0; color: #374151; font-size: 16px; line-height: 1.5;">
      Hi ${displayName},
    </p>
    <p style="margin: 0 0 15px 0; color: #374151; font-size: 16px; line-height: 1.5;">
      Thank you for your ${request.type === 'add' ? 'base submission' : 'base update request'} for <strong>${baseName}</strong>.
    </p>
    <p style="margin: 0 0 15px 0; color: #374151; font-size: 16px; line-height: 1.5;">
      After review, we are unable to approve this request at this time.
    </p>
    ${rejectionReason ? `
      <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; color: #991b1b; font-size: 14px;"><strong>Reason:</strong></p>
        <p style="margin: 5px 0 0 0; color: #991b1b; font-size: 14px;">${rejectionReason}</p>
      </div>
    ` : ''}
    <p style="margin: 20px 0 0 0; color: #374151; font-size: 16px; line-height: 1.5;">
      If you have questions or would like to submit a revised request, please contact our team.
    </p>
  `

  return {
    subject: `Base ${request.type === 'add' ? 'Submission' : 'Update'} Review: ${baseName}`,
    html: wrapEmail(content),
  }
}
