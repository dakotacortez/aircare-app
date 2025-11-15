'use client'

import { useState, useEffect } from 'react'

/**
 * Hook to detect if device is mobile/tablet/PWA (not desktop)
 * Used to conditionally show reference card features
 */
export function useDeviceType() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkDevice = () => {
      const isTouchDevice =
        window.matchMedia('(pointer: coarse)').matches ||
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0
      const isSmallScreen = window.innerWidth < 1024 // tablets and phones
      const standaloneMedia = window.matchMedia('(display-mode: standalone)')
      const isStandalonePWA =
        standaloneMedia.matches || (window.navigator as any).standalone === true

      // Consider it mobile if touch-capable, small screen, or running as an installed PWA
      setIsMobile(isTouchDevice || isSmallScreen || isStandalonePWA)
    }

    const standaloneMedia = window.matchMedia('(display-mode: standalone)')
    const handleDisplayModeChange = () => checkDevice()

    checkDevice()
    window.addEventListener('resize', checkDevice)
    window.addEventListener('orientationchange', checkDevice)

    if (standaloneMedia.addEventListener) {
      standaloneMedia.addEventListener('change', handleDisplayModeChange)
    } else if (standaloneMedia.addListener) {
      standaloneMedia.addListener(handleDisplayModeChange)
    }

    return () => {
      window.removeEventListener('resize', checkDevice)
      window.removeEventListener('orientationchange', checkDevice)
      if (standaloneMedia.removeEventListener) {
        standaloneMedia.removeEventListener('change', handleDisplayModeChange)
      } else if (standaloneMedia.removeListener) {
        standaloneMedia.removeListener(handleDisplayModeChange)
      }
    }
  }, [])

  return isMobile
}
