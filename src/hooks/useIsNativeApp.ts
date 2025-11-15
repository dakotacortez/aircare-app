'use client'

import { useEffect, useState } from 'react'

/**
 * Detect whether the app is running inside a native shell (Capacitor/standalone PWA).
 */
export function useIsNativeApp(): boolean {
  const [isNative, setIsNative] = useState(false)

  useEffect(() => {
    const detect = () => {
      if (typeof window === 'undefined') {
        setIsNative(false)
        return
      }

      const win = window as typeof window & {
        Capacitor?: {
          isNativePlatform?: () => boolean
        }
      }

      const capacitorNative = Boolean(win.Capacitor?.isNativePlatform?.())
      const standaloneMedia = window.matchMedia?.('(display-mode: standalone)').matches ?? false
      const iosStandalone = (window.navigator as typeof window.navigator & { standalone?: boolean }).standalone === true

      setIsNative(capacitorNative || standaloneMedia || iosStandalone)
    }

    detect()
  }, [])

  return isNative
}
