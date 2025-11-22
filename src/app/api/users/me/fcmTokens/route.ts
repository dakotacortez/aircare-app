import { getPayload } from 'payload'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

type Platform = 'android' | 'ios' | 'web'

interface FCMToken {
  token?: string
  platform?: Platform | null
  lastUsed?: string | null
  id?: string | null
}

export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const cookieStore = await cookies()
    const token = cookieStore.get('payload-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user from token
    const { user } = await payload.auth({ headers: req.headers })

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { token: fcmToken, platform } = body

    if (!fcmToken || !platform) {
      return NextResponse.json(
        { error: 'Missing required fields: token and platform' },
        { status: 400 }
      )
    }

    // Validate platform
    if (!['android', 'ios', 'web'].includes(platform)) {
      return NextResponse.json(
        { error: 'Invalid platform. Must be android, ios, or web' },
        { status: 400 }
      )
    }

    const validPlatform = platform as Platform

    // Get existing fcmTokens array
    const existingTokens = (user.fcmTokens || []) as FCMToken[]

    // Check if token already exists
    const tokenExists = existingTokens.some((t) => t.token === fcmToken)

    let updatedTokens: FCMToken[]
    if (tokenExists) {
      // Update lastUsed for existing token
      updatedTokens = existingTokens.map((t) =>
        t.token === fcmToken
          ? { ...t, platform: validPlatform, lastUsed: new Date().toISOString() }
          : t
      )
    } else {
      // Add new token
      updatedTokens = [
        ...existingTokens,
        {
          token: fcmToken,
          platform: validPlatform,
          lastUsed: new Date().toISOString(),
        },
      ]
    }

    // Update user with new/updated token
    await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        fcmTokens: updatedTokens,
      },
    })

    console.log(`[FCM Registration] Token ${tokenExists ? 'updated' : 'registered'} for user ${user.id} on platform ${platform}`)

    return NextResponse.json({
      success: true,
      message: tokenExists ? 'Token updated successfully' : 'Token registered successfully',
    })
  } catch (error) {
    console.error('[FCM Registration] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const cookieStore = await cookies()
    const token = cookieStore.get('payload-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user from token
    const { user } = await payload.auth({ headers: req.headers })

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { token: fcmToken } = body

    if (!fcmToken) {
      return NextResponse.json(
        { error: 'Missing required field: token' },
        { status: 400 }
      )
    }

    // Get existing fcmTokens array
    const existingTokens = (user.fcmTokens || []) as FCMToken[]

    // Remove the token
    const updatedTokens = existingTokens.filter((t) => t.token !== fcmToken)

    // Update user
    await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        fcmTokens: updatedTokens,
      },
    })

    console.log(`[FCM Registration] Token removed for user ${user.id}`)

    return NextResponse.json({
      success: true,
      message: 'Token removed successfully',
    })
  } catch (error) {
    console.error('[FCM Registration] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
