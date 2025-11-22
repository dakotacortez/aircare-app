'use client'

import React, { useEffect, createContext, useContext, useState } from 'react'
import {
  registerPushNotifications,
  setupPushNotificationListeners,
  isPushNotificationSupported,
  type PushNotificationRegistrationResult,
} from '@/utilities/pushNotifications'

interface PushNotificationContextType {
  isSupported: boolean
  isRegistered: boolean
  register: () => Promise<PushNotificationRegistrationResult>
  currentToken: string | null
}

const PushNotificationContext = createContext<PushNotificationContextType | undefined>(undefined)

export const usePushNotifications = () => {
  const context = useContext(PushNotificationContext)
  if (!context) {
    throw new Error('usePushNotifications must be used within PushNotificationProvider')
  }
  return context
}

export const PushNotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSupported] = useState(isPushNotificationSupported())
  const [isRegistered, setIsRegistered] = useState(false)
  const [currentToken, setCurrentToken] = useState<string | null>(null)

  useEffect(() => {
    // Only run on native platforms
    if (!isSupported) {
      return
    }

    // Set up push notification listeners once on mount
    setupPushNotificationListeners()
    console.log('[Push Notification Provider] Listeners set up')

    // Check if we should auto-register
    // We'll check localStorage to see if user has enabled push notifications
    const checkAndRegister = async () => {
      try {
        // Fetch current user to check if push notifications are enabled
        const response = await fetch('/api/users/me', {
          credentials: 'include',
        })

        if (response.ok) {
          const data = await response.json()
          const user = data.user

          if (user?.pushNotificationsEnabled) {
            console.log('[Push Notification Provider] Auto-registering for push notifications')
            const result = await registerPushNotifications()

            if (result.success) {
              setIsRegistered(true)
              setCurrentToken(result.token || null)
              console.log('[Push Notification Provider] Successfully registered')
            } else {
              console.error('[Push Notification Provider] Failed to register:', result.error)
            }
          }
        }
      } catch (error) {
        console.error('[Push Notification Provider] Error during auto-registration:', error)
      }
    }

    // Small delay to ensure app is fully loaded
    const timer = setTimeout(checkAndRegister, 1000)

    return () => clearTimeout(timer)
  }, [isSupported])

  const register = async (): Promise<PushNotificationRegistrationResult> => {
    const result = await registerPushNotifications()
    if (result.success) {
      setIsRegistered(true)
      setCurrentToken(result.token || null)
    }
    return result
  }

  return (
    <PushNotificationContext.Provider
      value={{
        isSupported,
        isRegistered,
        register,
        currentToken,
      }}
    >
      {children}
    </PushNotificationContext.Provider>
  )
}
