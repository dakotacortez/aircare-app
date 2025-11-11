import type { Access } from 'payload'

/**
 * Check if the user is an admin team member
 * @returns true if user has 'admin-team' role AND status is 'active'
 */
export const isAdmin: Access = ({ req: { user } }) => {
  if (!user) return false
  return user.role === 'admin-team' && user.status === 'active'
}
