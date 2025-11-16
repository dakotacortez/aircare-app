import { describe, expect, it } from 'vitest'
import { Users } from '@/collections/Users'
import type { User } from '@/payload-types'
import { checkProtocolAccess } from '@/utilities/checkProtocolAccess'

const beforeLoginHook = Users.hooks?.beforeLogin?.[0]

if (!beforeLoginHook) {
  throw new Error('Users beforeLogin hook is not defined')
}

const baseTimestamp = new Date().toISOString()

const buildUser = (overrides: Partial<User> = {}): User => ({
  id: 1,
  name: 'Test User',
  role: 'user',
  approved: true,
  status: 'active',
  email: 'test@example.com',
  createdAt: baseTimestamp,
  updatedAt: baseTimestamp,
  ...overrides,
})

describe('Users.beforeLogin hook', () => {
  it('allows admin team members regardless of approval/status', async () => {
    const adminUser = buildUser({ role: 'admin-team', approved: false, status: 'pending' })

    const result = await beforeLoginHook({ user: adminUser } as any)

    expect(result).toEqual(adminUser)
  })

  it('rejects unapproved users with a 403 error', async () => {
    const pendingUser = buildUser({ approved: false })

    await expect(beforeLoginHook({ user: pendingUser } as any)).rejects.toMatchObject({
      message: 'Your account is pending approval. Please contact an administrator.',
      status: 403,
    })
  })

  it('rejects inactive users with a 403 error', async () => {
    const inactiveUser = buildUser({ status: 'inactive' })

    await expect(beforeLoginHook({ user: inactiveUser } as any)).rejects.toMatchObject({
      message: 'Your account is not active. Please contact an administrator.',
      status: 403,
    })
  })
})

describe('checkProtocolAccess utility', () => {
  it('denies guests', () => {
    expect(checkProtocolAccess(null)).toEqual({ allowed: false, reason: 'not-logged-in' })
  })

  it('denies inactive users', () => {
    const inactiveUser = buildUser({ status: 'inactive' })

    expect(checkProtocolAccess(inactiveUser)).toEqual({
      allowed: false,
      reason: 'inactive',
      user: inactiveUser,
    })
  })

  it('denies pending approval users', () => {
    const pendingUser = buildUser({ approved: false })

    expect(checkProtocolAccess(pendingUser)).toEqual({
      allowed: false,
      reason: 'pending-approval',
      user: pendingUser,
    })
  })

  it('allows approved clinical users', () => {
    const clinicalUser = buildUser()

    expect(checkProtocolAccess(clinicalUser)).toEqual({ allowed: true, user: clinicalUser })
  })

  it('allows content team members with active status', () => {
    const contentUser = buildUser({ role: 'content-team' })

    expect(checkProtocolAccess(contentUser)).toEqual({ allowed: true, user: contentUser })
  })
})
