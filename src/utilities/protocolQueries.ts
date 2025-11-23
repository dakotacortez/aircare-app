import { getPayload } from 'payload'
import config from '@payload-config'
import type { User, Protocol } from '@/payload-types'
import type { Where } from 'payload'
import { checkProtocolAccess } from './checkProtocolAccess'

/**
 * Safely fetch protocols for an authenticated user
 *
 * This helper centralizes the pattern of:
 * 1. Checking user access via checkProtocolAccess()
 * 2. Using overrideAccess: true to bypass Payload's ACL (which fails in serverless contexts)
 *
 * SECURITY: This function MUST only be called after proper authentication.
 * It enforces access control via checkProtocolAccess() before allowing any queries.
 *
 * @throws Error if user doesn't have protocol access
 */
export async function findProtocolsForUser(
  user: User | null,
  options?: {
    where?: Where
    limit?: number
    sort?: string
    draft?: boolean
    depth?: number
  }
) {
  // CRITICAL: Check access first - this is our security gate
  const accessStatus = checkProtocolAccess(user)

  if (!accessStatus.allowed) {
    throw new Error(`Protocol access denied: ${accessStatus.reason}`)
  }

  const currentUser = accessStatus.user
  const payload = await getPayload({ config })

  // Determine if user can see drafts
  const canSeeDrafts = options?.draft &&
    (currentUser.role === 'content-team' || currentUser.role === 'admin-team')

  // Build safe server-side filters
  const where: Where = {
    // Regular users can only see published protocols
    ...(!canSeeDrafts && {
      _status: { equals: 'published' },
    }),
    // Merge any additional filters
    ...options?.where,
  }

  // Safe to use overrideAccess because:
  // - User is authenticated (checkProtocolAccess verifies this)
  // - User has proper role/approval (checkProtocolAccess verifies this)
  // - We enforce server-side filters above (published-only for regular users)
  const result = await payload.find({
    collection: 'protocols',
    draft: canSeeDrafts,
    overrideAccess: true,
    where,
    sort: options?.sort || '_order',
    limit: options?.limit,
    depth: options?.depth,
  })

  return result
}

/**
 * Safely fetch a single protocol by code for an authenticated user
 *
 * @throws Error if user doesn't have protocol access
 */
export async function findProtocolByCodeForUser(
  user: User | null,
  code: string,
  options?: {
    draft?: boolean
    depth?: number
  }
) {
  const result = await findProtocolsForUser(user, {
    where: { code: { equals: code } },
    limit: 1,
    draft: options?.draft,
    depth: options?.depth,
  })

  return result.docs[0] || null
}

/**
 * Safely fetch protocols for metadata generation
 *
 * This is a special case that doesn't enforce user authentication
 * but still restricts to published protocols only.
 */
export async function findProtocolsForMetadata(options?: {
  where?: Where
  limit?: number
}) {
  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'protocols',
    draft: false,
    overrideAccess: true, // Safe: always filters to published only
    where: {
      _status: { equals: 'published' },
      ...options?.where,
    },
    limit: options?.limit,
  })

  return result
}
