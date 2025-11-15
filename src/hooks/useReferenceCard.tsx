'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react'

import { useDeviceType } from './useDeviceType'
import type { ReferenceCard, CardEntry, CalculationData } from '@/types/referenceCard'

const STORAGE_KEY = 'acmc-reference-cards'
const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000

// Helper functions
function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  })
}

export function formatTimeAgo(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}h ${minutes % 60}min ago`
  }
  return `${minutes}min ago`
}

type ReferenceCardContextValue = {
  cards: ReferenceCard[]
  drawerOpen: boolean
  setDrawerOpen: Dispatch<SetStateAction<boolean>>
  savedCount: number
  createCard: (name?: string) => string
  addEntryToCard: (cardId: string, entry: Omit<CardEntry, 'id' | 'timestamp'>) => void
  saveCalculation: (
    calculatorName: string,
    inputs: Record<string, any>,
    outputs: Record<string, any>,
  ) => CalculationData
  deleteCard: (cardId: string) => void
  deleteEntry: (cardId: string, entryId: string) => void
  clearAll: () => void
  exportCards: () => string
  isMobile: boolean
}

const noopDispatch: Dispatch<SetStateAction<boolean>> = () => undefined
const emptyCalculation: CalculationData = { calculatorName: '', inputs: {}, outputs: {} }

const defaultReferenceCardValue: ReferenceCardContextValue = {
  cards: [],
  drawerOpen: false,
  setDrawerOpen: noopDispatch,
  savedCount: 0,
  createCard: () => '',
  addEntryToCard: () => {},
  saveCalculation: () => emptyCalculation,
  deleteCard: () => {},
  deleteEntry: () => {},
  clearAll: () => {},
  exportCards: () => '',
  isMobile: false,
}

const ReferenceCardContext = createContext<ReferenceCardContextValue>(defaultReferenceCardValue)

export const ReferenceCardProvider = ({ children }: { children: ReactNode }) => {
  const providerValue = useReferenceCardState()

  return (
    <ReferenceCardContext.Provider value={providerValue}>
      {children}
    </ReferenceCardContext.Provider>
  )
}

export function useReferenceCard(): ReferenceCardContextValue {
  return useContext(ReferenceCardContext)
}

function useReferenceCardState(): ReferenceCardContextValue {
  const isMobile = useDeviceType()
  const [cards, setCards] = useState<ReferenceCard[]>([])
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Initialize: Load from localStorage and clean expired
  useEffect(() => {
    if (!isMobile) return

    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed: ReferenceCard[] = JSON.parse(stored)
        const active = parsed.filter((card) => card.expiresAt > Date.now())
        setCards(active)
        if (active.length !== parsed.length) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(active))
        }
      } catch (error) {
        console.error('Failed to parse reference cards:', error)
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }, [isMobile])

  // Persist to localStorage whenever cards change
  useEffect(() => {
    if (!isMobile) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards))
  }, [cards, isMobile])

  // Create new card
  const createCard = useCallback(
    (name?: string): string => {
      if (!isMobile) return ''

      const now = Date.now()
      const card: ReferenceCard = {
        id: crypto.randomUUID(),
        name: name || `Card - ${formatTime(now)}`,
        createdAt: now,
        expiresAt: now + TWENTY_FOUR_HOURS,
        entries: [],
      }
      setCards((prev) => [...prev, card])
      return card.id
    },
    [isMobile],
  )

  // Add entry to card
  const addEntryToCard = useCallback(
    (cardId: string, entry: Omit<CardEntry, 'id' | 'timestamp'>) => {
      if (!isMobile) return

      setCards((prev) =>
        prev.map((card) => {
          if (card.id === cardId) {
            return {
              ...card,
              entries: [
                ...card.entries,
                {
                  ...entry,
                  id: crypto.randomUUID(),
                  timestamp: Date.now(),
                },
              ],
            }
          }
          return card
        }),
      )
    },
    [isMobile],
  )

  // Save calculation (returns data for modal)
  const saveCalculation = useCallback(
    (
      calculatorName: string,
      inputs: Record<string, any>,
      outputs: Record<string, any>,
    ): CalculationData => {
      return { calculatorName, inputs, outputs }
    },
    [],
  )

  // Delete card
  const deleteCard = useCallback(
    (cardId: string) => {
      if (!isMobile) return
      setCards((prev) => prev.filter((card) => card.id !== cardId))
    },
    [isMobile],
  )

  // Delete entry
  const deleteEntry = useCallback(
    (cardId: string, entryId: string) => {
      if (!isMobile) return

      setCards((prev) =>
        prev.map((card) => {
          if (card.id === cardId) {
            return {
              ...card,
              entries: card.entries.filter((entry) => entry.id !== entryId),
            }
          }
          return card
        }),
      )
    },
    [isMobile],
  )

  // Clear all cards
  const clearAll = useCallback(() => {
    if (!isMobile) return

    if (confirm('Clear all reference cards? This cannot be undone.')) {
      setCards([])
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [isMobile])

  // Export cards
  const exportCards = useCallback((): string => {
    let output = '═══════════════════════════════════\n'
    output += 'ACMC REFERENCE CARD\n'
    output += `${formatDate(Date.now())}\n`
    output += '═══════════════════════════════════\n\n'

    cards.forEach((card) => {
      output += `${card.name.toUpperCase()}\n\n`

        card.entries.forEach((entry) => {
          if (entry.type === 'calculation') {
            output += `[CALCULATED] ${entry.calculatorName}\n`
            if (entry.inputs && Object.keys(entry.inputs).length > 0) {
              Object.entries(entry.inputs).forEach(([key, value]) => {
                output += `  ${key}: ${value}\n`
              })
            }
            if (entry.outputs && Object.keys(entry.outputs).length > 0) {
              Object.entries(entry.outputs).forEach(([key, value]) => {
                output += `  • ${key}: ${value}\n`
              })
            }
            output += '\n'
          } else {
            if (entry.timeAction) {
              output += `[${entry.timeAction}]\n`
            } else {
              output += `[NOTE]\n`
            }
            output += `${entry.noteText}\n\n`
          }
        })

      output += '───────────────────────────────────\n\n'
    })

    output += '═══════════════════════════════════\n'

    return output
  }, [cards])

  const contextValue = useMemo<ReferenceCardContextValue>(
    () => ({
      cards,
      drawerOpen,
      setDrawerOpen,
      savedCount: cards.length,
      createCard,
      addEntryToCard,
      saveCalculation,
      deleteCard,
      deleteEntry,
      clearAll,
      exportCards,
      isMobile,
    }),
    [
      addEntryToCard,
      cards,
      clearAll,
      deleteCard,
      deleteEntry,
      drawerOpen,
      exportCards,
      isMobile,
      saveCalculation,
      createCard,
    ],
  )

  return isMobile ? contextValue : defaultReferenceCardValue
}
