/**
 * Push Notification Registration Utility
 *
 * Handles FCM token registration for Android/iOS apps using Capacitor
 */

import { PushNotifications } from '@capacitor/push-notifications'
import { Capacitor } from '@capacitor/core'

export interface PushNotificationRegistrationResult {
  success: boolean
  token?: string
  error?: string
}

/**
 * Check if push notifications are supported on this platform
 */
export function isPushNotificationSupported(): boolean {
  // Push notifications only work on native platforms (Android/iOS)
  return Capacitor.isNativePlatform()
}

/**
 * Request push notification permission and register FCM token
 * This should be called when:
 * 1. User enables push notifications in settings
 * 2. App initializes and user has previously enabled push notifications
 */
export async function registerPushNotifications(): Promise<PushNotificationRegistrationResult> {
  try {
    // Check if running on native platform
    if (!isPushNotificationSupported()) {
      console.log('[Push Notifications] Not supported on web platform')
      return {
        success: false,
        error: 'Push notifications are only available on mobile devices',
      }
    }

    // Request permission
    console.log('[Push Notifications] Requesting permission...')
    const permResult = await PushNotifications.requestPermissions()

    if (permResult.receive !== 'granted') {
      console.log('[Push Notifications] Permission denied')
      return {
        success: false,
        error: 'Push notification permission was denied',
      }
    }

    console.log('[Push Notifications] Permission granted, registering...')

    // Remove any existing registration listeners to prevent duplicates
    await PushNotifications.removeAllListeners()

    // Register with FCM
    await PushNotifications.register()

    // Wait for registration to complete and get the token
    return new Promise((resolve) => {
      let resolved = false

      // Set up one-time listener for registration
      const registrationListener = PushNotifications.addListener('registration', async (token) => {
        if (resolved) return
        resolved = true

        console.log('[Push Notifications] Got FCM token:', token.value.substring(0, 20) + '...')

        // Clean up listeners
        await registrationListener.remove()
        await errorListener.remove()

        // Determine platform
        const platform = Capacitor.getPlatform() === 'ios' ? 'ios' : 'android'

        // Register token with backend
        try {
          const response = await fetch('/api/users/me/fcmTokens', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              token: token.value,
              platform,
            }),
          })

          if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Unknown error' }))
            console.error('[Push Notifications] Failed to register token with backend:', error)
            resolve({
              success: false,
              error: error.error || 'Failed to register token with server',
            })
            return
          }

          console.log('[Push Notifications] Token successfully registered with backend')

          // Re-setup the persistent listeners for receiving notifications
          setupPushNotificationListeners()

          resolve({
            success: true,
            token: token.value,
          })
        } catch (error) {
          console.error('[Push Notifications] Error registering token with backend:', error)
          resolve({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to register token',
          })
        }
      })

      // Set up error listener
      const errorListener = PushNotifications.addListener('registrationError', async (error) => {
        if (resolved) return
        resolved = true

        console.error('[Push Notifications] Registration error:', error)

        // Clean up listeners
        await registrationListener.remove()
        await errorListener.remove()

        resolve({
          success: false,
          error: error.error || 'Failed to register for push notifications',
        })
      })

      // Timeout after 10 seconds
      setTimeout(async () => {
        if (resolved) return
        resolved = true

        // Clean up listeners
        await registrationListener.remove()
        await errorListener.remove()

        resolve({
          success: false,
          error: 'Registration timeout',
        })
      }, 10000)
    })
  } catch (error) {
    console.error('[Push Notifications] Unexpected error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error occurred',
    }
  }
}

/**
 * Remove FCM token from backend (call when user disables push notifications)
 */
export async function unregisterPushNotifications(token: string): Promise<boolean> {
  try {
    const response = await fetch('/api/users/me/fcmTokens', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ token }),
    })

    if (!response.ok) {
      console.error('[Push Notifications] Failed to unregister token')
      return false
    }

    console.log('[Push Notifications] Token unregistered successfully')
    return true
  } catch (error) {
    console.error('[Push Notifications] Error unregistering token:', error)
    return false
  }
}

/**
 * Set up push notification listeners for receiving notifications
 * Call this once during app initialization
 */
export function setupPushNotificationListeners() {
  if (!isPushNotificationSupported()) {
    return
  }

  // Listen for push notifications received
  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('[Push Notifications] Notification received:', notification)
    // You can add custom handling here, such as showing a toast or updating UI
  })

  // Listen for notification actions (when user taps on notification)
  PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
    console.log('[Push Notifications] Notification action performed:', notification)
    // You can add custom handling here, such as navigating to a specific page
  })
}

/**
 * Remove all push notification listeners
 */
export async function removePushNotificationListeners() {
  if (!isPushNotificationSupported()) {
    return
  }

  await PushNotifications.removeAllListeners()
}
