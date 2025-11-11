import type { Access } from 'payload'

/**
 * Check if the user is approved (any role: user, content-team, or admin-team)
 * @returns true if user is approved AND status is 'active'
 */
export const isApprovedUser: Access = ({ req: { user } }) => {
  if (!user) return false
  return user.approved === true && user.status === 'active'
}
