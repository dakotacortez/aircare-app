import type { Access } from 'payload'

/**
 * Check if the user is a content team member
 * @returns true if user has 'content-team' role AND status is 'active'
 */
export const isContentTeam: Access = ({ req: { user } }) => {
  if (!user) return false
  return user.role === 'content-team' && user.status === 'active'
}
