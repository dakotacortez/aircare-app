'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type ServiceLineType = 'BLS' | 'ALS' | 'CCT'

interface ServiceLineContextType {
  serviceLine: ServiceLineType
  setServiceLine: (line: ServiceLineType) => void
}

const ServiceLineContext = createContext<ServiceLineContextType | null>(null)

const SERVICE_LINE_STORAGE_KEY = 'aircare-service-line'

/**
 * Provider for managing service line selection (BLS/ALS/CCT)
 * Persists selection to localStorage with cross-tab sync
 */
export function ServiceLineProvider({ children }: { children: ReactNode }) {
  // Lazy initialization: read localStorage immediately on first render
  // This prevents flash and ensures correct value from the start
  const [serviceLine, setServiceLineState] = useState<ServiceLineType>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(SERVICE_LINE_STORAGE_KEY)
      // Validate and sanitize the stored value
      if (stored === 'BLS' || stored === 'ALS' || stored === 'CCT') {
        return stored
      }
      // If invalid value exists, clear it
      if (stored) {
        localStorage.removeItem(SERVICE_LINE_STORAGE_KEY)
      }
    }
    return 'ALS' // Default to ALS
  })

  // Save to localStorage when changed
  const setServiceLine = (line: ServiceLineType) => {
    setServiceLineState(line)
    if (typeof window !== 'undefined') {
      localStorage.setItem(SERVICE_LINE_STORAGE_KEY, line)
    }
  }

  // Cross-tab sync: update when localStorage changes in other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === SERVICE_LINE_STORAGE_KEY && e.newValue) {
        if (e.newValue === 'BLS' || e.newValue === 'ALS' || e.newValue === 'CCT') {
          setServiceLineState(e.newValue)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  return (
    <ServiceLineContext.Provider value={{ serviceLine, setServiceLine }}>
      {children}
    </ServiceLineContext.Provider>
  )
}

/**
 * Hook to access service line context
 */
export function useServiceLine(): ServiceLineContextType {
  const context = useContext(ServiceLineContext)
  if (!context) {
    throw new Error('useServiceLine must be used within ServiceLineProvider')
  }
  return context
}
