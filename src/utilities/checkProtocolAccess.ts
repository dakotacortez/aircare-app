import type { User } from '@/payload-types'

export type ProtocolAccessStatus =
  | { allowed: true; user: User }
  | { allowed: false; reason: 'not-logged-in' }
  | { allowed: false; reason: 'pending-approval'; user: User }
  | { allowed: false; reason: 'inactive'; user: User }

/**
 * Check if a user has access to view protocols
 * Returns the access status and reason if denied
 */
export function checkProtocolAccess(user: User | null): ProtocolAccessStatus {
  // No user = not logged in
  if (!user) {
    return { allowed: false, reason: 'not-logged-in' }
  }

  // User must be active
  if (user.status !== 'active') {
    return { allowed: false, reason: 'inactive', user }
  }

  // Content Team and Admin always have access
  if (user.role === 'content-team' || user.role === 'admin-team') {
    return { allowed: true, user }
  }

  // Regular users must be approved
  if (user.role === 'user') {
    if (!user.approved) {
      return { allowed: false, reason: 'pending-approval', user }
    }
    return { allowed: true, user }
  }

  // Fallback: deny access
  return { allowed: false, reason: 'inactive', user }
}
