/**
 * 3-WAY CERTIFICATION LEVEL TOGGLE
 * Allows users to switch between BLS / ALS / CCT views
 */

'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'

// ============================================================================
// 1. CONTEXT & PROVIDER
// ============================================================================

interface CertificationContextType {
  selectedLevel: 'bls' | 'als' | 'cct'
  setSelectedLevel: (level: 'bls' | 'als' | 'cct') => void
  getLevelNumber: () => number
}

const CertificationContext = createContext<CertificationContextType | null>(null)

/**
 * Provider to wrap the app (or just protocol pages)
 * Place in layout.tsx or protocols layout
 */
export function CertificationLevelProvider({ children }: { children: ReactNode }) {
  const [selectedLevel, setSelectedLevel] = useState<'bls' | 'als' | 'cct'>('als')

  const getLevelNumber = () => {
    switch (selectedLevel) {
      case 'bls':
        return 1 // EMT level - sees Basic + EMT content
      case 'als':
        return 3 // ALS/Paramedic - sees Basic + EMT + AEMT + ALS
      case 'cct':
        return 4 // CCT - sees everything
      default:
        return 3
    }
  }

  return (
    <CertificationContext.Provider value={{ selectedLevel, setSelectedLevel, getLevelNumber }}>
      {children}
    </CertificationContext.Provider>
  )
}

/**
 * Hook to get current certification level
 * Replace the existing useCertificationLevel in RichTextContent.tsx
 */
export function useCertificationLevel(): number {
  const context = useContext(CertificationContext)
  if (!context) {
    return 3 // Default to ALS if provider not found
  }
  return context.getLevelNumber()
}

// ============================================================================
// 2. TOGGLE UI COMPONENT
// ============================================================================

/**
 * 3-Way Toggle Component
 * Place this in the header, toolbar, or ProtocolTools sidebar
 */
export function CertificationToggle() {
  const context = useContext(CertificationContext)

  if (!context) {
    return null
  }

  const { selectedLevel, setSelectedLevel } = context

  return (
    <div className="rounded-2xl border dark:border-neutral-700 p-4 bg-white dark:bg-neutral-800">
      <h3 className="text-sm font-semibold mb-3 text-neutral-900 dark:text-neutral-100">
        Certification Level
      </h3>

      {/* 3-Way Segmented Control */}
      <div className="inline-flex rounded-lg border dark:border-neutral-700 p-1 bg-neutral-50 dark:bg-neutral-900 w-full">
        <button
          onClick={() => setSelectedLevel('bls')}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all ${
            selectedLevel === 'bls'
              ? 'bg-green-600 text-white shadow-sm'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
          }`}
        >
          BLS
        </button>
        <button
          onClick={() => setSelectedLevel('als')}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all ${
            selectedLevel === 'als'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
          }`}
        >
          ALS
        </button>
        <button
          onClick={() => setSelectedLevel('cct')}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all ${
            selectedLevel === 'cct'
              ? 'bg-red-600 text-white shadow-sm'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
          }`}
        >
          CCT
        </button>
      </div>

      {/* Description */}
      <div className="mt-3 text-xs text-neutral-600 dark:text-neutral-400">
        {selectedLevel === 'bls' && (
          <p>Viewing: <strong>Basic Life Support</strong> protocols and procedures</p>
        )}
        {selectedLevel === 'als' && (
          <p>Viewing: <strong>Advanced Life Support</strong> (includes BLS content)</p>
        )}
        {selectedLevel === 'cct' && (
          <p>Viewing: <strong>Critical Care Transport</strong> (all content visible)</p>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// 3. ALTERNATIVE: COMPACT TOGGLE FOR HEADER
// ============================================================================

/**
 * Compact toggle for placing in page header
 */
export function CertificationToggleCompact() {
  const context = useContext(CertificationContext)

  if (!context) {
    return null
  }

  const { selectedLevel, setSelectedLevel } = context

  return (
    <div className="inline-flex rounded-lg border dark:border-neutral-700 p-0.5 bg-white dark:bg-neutral-800">
      <button
        onClick={() => setSelectedLevel('bls')}
        className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
          selectedLevel === 'bls'
            ? 'bg-green-600 text-white'
            : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700'
        }`}
      >
        BLS
      </button>
      <button
        onClick={() => setSelectedLevel('als')}
        className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
          selectedLevel === 'als'
            ? 'bg-purple-600 text-white'
            : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700'
        }`}
      >
        ALS
      </button>
      <button
        onClick={() => setSelectedLevel('cct')}
        className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
          selectedLevel === 'cct'
            ? 'bg-red-600 text-white'
            : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700'
        }`}
      >
        CCT
      </button>
    </div>
  )
}

// ============================================================================
// 4. USAGE EXAMPLES
// ============================================================================

/**
 * STEP 1: Wrap your app/layout with provider
 *
 * In src/app/(frontend)/layout.tsx or src/app/(frontend)/protocols/layout.tsx:
 *
 * import { CertificationLevelProvider } from '@/components/CertificationContext'
 *
 * export default function Layout({ children }) {
 *   return (
 *     <CertificationLevelProvider>
 *       {children}
 *     </CertificationLevelProvider>
 *   )
 * }
 */

/**
 * STEP 2: Replace useCertificationLevel in RichTextContent.tsx
 *
 * Change from:
 *   export function useCertificationLevel(): number {
 *     return 5 // Hardcoded
 *   }
 *
 * To:
 *   export { useCertificationLevel } from '@/components/CertificationContext'
 */

/**
 * STEP 3: Add toggle to ProtocolTools.tsx
 *
 * import { CertificationToggle } from '@/components/CertificationContext'
 *
 * // Inside ProtocolTools component, add:
 * <div className="p-4 space-y-4">
 *   <CertificationToggle />
 *   <DoseCalculator ... />
 * </div>
 */

/**
 * STEP 4: OR add compact toggle to page header
 *
 * import { CertificationToggleCompact } from '@/components/CertificationContext'
 *
 * // In ProtocolContent.tsx header section:
 * <div className="h-12 border-b ... flex items-center gap-3 px-4">
 *   <button>Menu</button>
 *   <CertificationToggleCompact />
 *   <div>Breadcrumb...</div>
 * </div>
 */

// ============================================================================
// 5. LEVEL MAPPING
// ============================================================================

/**
 * How the 3-way toggle maps to cert levels:
 *
 * BLS (level 1 - EMT):
 *   - Sees: Basic/EMR (0), EMT (1) content
 *   - Hides: AEMT (2), ALS (3), CCT (4)
 *   - Always sees: Medical Control & Physician Only callouts
 *
 * ALS (level 3 - Paramedic):
 *   - Sees: Basic (0), EMT (1), AEMT (2), ALS (3) content
 *   - Hides: CCT (4) only
 *   - Always sees: Medical Control & Physician Only callouts
 *
 * CCT (level 4):
 *   - Sees: ALL content (0-4)
 *   - Nothing hidden
 *   - Always sees: Medical Control & Physician Only callouts
 */

// ============================================================================
// 6. ALTERNATIVE: DROPDOWN INSTEAD OF TOGGLE
// ============================================================================

export function CertificationDropdown() {
  const context = useContext(CertificationContext)

  if (!context) {
    return null
  }

  const { selectedLevel, setSelectedLevel } = context

  return (
    <div>
      <label className="text-xs text-neutral-600 dark:text-neutral-400 block mb-1">
        View as:
      </label>
      <select
        value={selectedLevel}
        onChange={(e) => setSelectedLevel(e.target.value as 'bls' | 'als' | 'cct')}
        className="w-full border dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-600 outline-none"
      >
        <option value="bls">BLS (Basic Life Support)</option>
        <option value="als">ALS (Advanced Life Support)</option>
        <option value="cct">CCT (Critical Care Transport)</option>
      </select>
    </div>
  )
}
