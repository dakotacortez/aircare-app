'use client'

import { useState, useEffect } from 'react'

/**
 * Hook to detect if device is mobile/tablet (not desktop)
 * Used to conditionally show reference card features
 */
export function useDeviceType() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkDevice = () => {
      // Check screen size AND touch capability
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      const isSmallScreen = window.innerWidth < 1024 // tablets and phones

      setIsMobile(isTouchDevice && isSmallScreen)
    }

    checkDevice()
    window.addEventListener('resize', checkDevice)

    return () => window.removeEventListener('resize', checkDevice)
  }, [])

  return isMobile
}
