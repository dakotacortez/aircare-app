import type { Access } from 'payload'

/**
 * Check if any user is logged in with active status
 * @returns true if user exists and status is 'active'
 */
export const isLoggedIn: Access = ({ req: { user } }) => {
  if (!user) return false
  return user.status === 'active'
}

/**
 * Check if the user is either content team or admin team
 * @returns true if user has 'content-team' OR 'admin-team' role AND status is 'active'
 * 
 * Note: This is an alias for isContentTeamOrAdmin for consistency with requirements
 */
export const isContentOrAdmin: Access = ({ req: { user } }) => {
  if (!user) return false
  return (
    (user.role === 'content-team' || user.role === 'admin-team') && user.status === 'active'
  )
}
