import type { Access } from 'payload'

/**
 * Check if the user is either content team or admin team
 * @returns true if user has 'content-team' OR 'admin-team' role AND status is 'active'
 */
export const isContentTeamOrAdmin: Access = ({ req: { user } }) => {
  if (!user) return false
  return (
    (user.role === 'content-team' || user.role === 'admin-team') && user.status === 'active'
  )
}
