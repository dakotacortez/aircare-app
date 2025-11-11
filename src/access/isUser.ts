import type { Access } from 'payload'

/**
 * Check if the user is an approved clinical team member
 * @returns true if user has 'user' role AND is approved AND status is 'active'
 */
export const isUser: Access = ({ req: { user } }) => {
  if (!user) return false
  return user.role === 'user' && user.approved === true && user.status === 'active'
}
