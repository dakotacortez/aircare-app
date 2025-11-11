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
 * Persists selection to localStorage
 */
export function ServiceLineProvider({ children }: { children: ReactNode }) {
  const [serviceLine, setServiceLineState] = useState<ServiceLineType>('ALS')
  const [hydrated, setHydrated] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(SERVICE_LINE_STORAGE_KEY)
    if (stored === 'BLS' || stored === 'ALS' || stored === 'CCT') {
      setServiceLineState(stored)
    }
    setHydrated(true)
  }, [])

  // Save to localStorage when changed
  const setServiceLine = (line: ServiceLineType) => {
    setServiceLineState(line)
    localStorage.setItem(SERVICE_LINE_STORAGE_KEY, line)
  }

  // Don't render until hydrated to avoid SSR mismatch
  if (!hydrated) {
    return <>{children}</>
  }

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
