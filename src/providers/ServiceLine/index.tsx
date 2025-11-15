'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type ServiceLineType = 'BLS' | 'ALS' | 'CCT'

interface ServiceLineContextType {
  serviceLine: ServiceLineType
  setServiceLine: (line: ServiceLineType) => void
}

const ServiceLineContext = createContext<ServiceLineContextType | null>(null)

const SERVICE_LINE_STORAGE_KEY = 'aircare-service-line'
const SERVICE_LINE_META_KEY = 'aircare-service-line-meta'

type ServiceLineMeta = {
  userId?: string
  defaultServiceLine?: ServiceLineType
}

const isValidServiceLine = (value: unknown): value is ServiceLineType => {
  return value === 'BLS' || value === 'ALS' || value === 'CCT'
}

const readMeta = (): ServiceLineMeta | null => {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem(SERVICE_LINE_META_KEY)
    if (!stored) return null
    const parsed = JSON.parse(stored) as ServiceLineMeta
    return parsed
  } catch {
    localStorage.removeItem(SERVICE_LINE_META_KEY)
    return null
  }
}

const writeMeta = (meta: ServiceLineMeta | null) => {
  if (typeof window === 'undefined') return
  if (!meta || (!meta.userId && !meta.defaultServiceLine)) {
    localStorage.removeItem(SERVICE_LINE_META_KEY)
    return
  }
  localStorage.setItem(SERVICE_LINE_META_KEY, JSON.stringify(meta))
}

/**
 * Provider for managing service line selection (BLS/ALS/CCT)
 * Persists selection to localStorage with cross-tab sync
 * Falls back to user's default service line if no localStorage value exists
 * Resets when a different user logs in or their default assignment changes
 */
export function ServiceLineProvider({ children }: { children: ReactNode }) {
  // Always start with 'ALS' to prevent hydration mismatch
  // Will be updated from localStorage and user preferences after mount
  const [serviceLine, setServiceLineState] = useState<ServiceLineType>('ALS')

  // Hydrate from localStorage and fetch user default after mount
  useEffect(() => {
    let storedLine: ServiceLineType | null = null

    // First, check localStorage for saved preference
    const stored = localStorage.getItem(SERVICE_LINE_STORAGE_KEY)
    if (isValidServiceLine(stored)) {
      storedLine = stored
      setServiceLineState(stored)
    } else if (stored) {
      localStorage.removeItem(SERVICE_LINE_STORAGE_KEY)
    }

    // Fetch user's default to ensure we respect their assignment
    const fetchUserDefault = async () => {
      try {
        const res = await fetch('/api/users/me')
        if (!res.ok) {
          return
        }

        const data = await res.json()
        const defaultLine = data.user?.defaultServiceLine
        const userId = data.user?.id

        if (!userId) {
          writeMeta(null)
          return
        }

        const meta = readMeta()
        let shouldResetStored = false

        if (meta) {
          if (meta.userId !== userId) {
            shouldResetStored = true
          } else if (
            meta.defaultServiceLine &&
            isValidServiceLine(defaultLine) &&
            meta.defaultServiceLine !== defaultLine
          ) {
            shouldResetStored = true
          }
        }

        if (shouldResetStored) {
          localStorage.removeItem(SERVICE_LINE_STORAGE_KEY)
          storedLine = null
        }

        if (!storedLine && isValidServiceLine(defaultLine)) {
          setServiceLineState(defaultLine)
          localStorage.setItem(SERVICE_LINE_STORAGE_KEY, defaultLine)
          storedLine = defaultLine
        }

        writeMeta({
          userId,
          defaultServiceLine: isValidServiceLine(defaultLine) ? defaultLine : undefined,
        })
      } catch (error) {
        console.debug('Could not fetch user default service line:', error)
      }
    }

    fetchUserDefault()
  }, [])

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
      if (e.key === SERVICE_LINE_STORAGE_KEY && e.newValue && isValidServiceLine(e.newValue)) {
        setServiceLineState(e.newValue)
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
