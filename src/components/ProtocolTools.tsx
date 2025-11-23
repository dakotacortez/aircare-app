'use client'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Syringe, X, ChevronUp, Calculator, ChevronLeft, ChevronRight } from 'lucide-react'
import { useReferenceCard } from '@/hooks/useReferenceCard'
import { SaveCalculationModal } from '@/components/ReferenceCard'
import type { CalculationData } from '@/types/referenceCard'
import type { CSSProperties } from 'react'

interface ProtocolToolsProps {
  isOpen: boolean
  onToggleDrawer: () => void
  onRequestClose: () => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

const FAB_STORAGE_KEY = 'protocol-tools-fab-position'
const FAB_SIZE = 64
const FAB_PADDING = 12

type FabPosition = {
  x: number
  y: number
}

type DragState = {
  pointerId: number
  startX: number
  startY: number
  origin: FabPosition
  moved: boolean
}

const clampFabPosition = (position: FabPosition): FabPosition => {
  if (typeof window === 'undefined') {
    return position
  }

  const maxX = window.innerWidth - FAB_SIZE - FAB_PADDING
  const maxY = window.innerHeight - FAB_SIZE - FAB_PADDING

  return {
    x: Math.min(Math.max(position.x, FAB_PADDING), Math.max(FAB_PADDING, maxX)),
    y: Math.min(Math.max(position.y, FAB_PADDING), Math.max(FAB_PADDING, maxY)),
  }
}

const getDefaultFabPosition = (): FabPosition => {
  if (typeof window === 'undefined') {
    return { x: 0, y: 0 }
  }

  return clampFabPosition({
    x: window.innerWidth - FAB_PADDING - FAB_SIZE,
    y: window.innerHeight - FAB_PADDING - FAB_SIZE,
  })
}

const persistFabPosition = (position: FabPosition) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(FAB_STORAGE_KEY, JSON.stringify(position))
  } catch {
    // Swallow write errors (storage may be unavailable in private browsing)
  }
}

export function ProtocolTools({
  isOpen,
  onToggleDrawer,
  onRequestClose,
  isCollapsed = false,
  onToggleCollapse,
}: ProtocolToolsProps) {
  const [weight, setWeight] = useState('')
  const [dose, setDose] = useState('')
  const [hasSavedResult, setHasSavedResult] = useState(false)
  const [fabPosition, setFabPosition] = useState<FabPosition | null>(null)
  const dragStateRef = useRef<DragState | null>(null)
  const suppressNextClickRef = useRef(false)

  const handleWeightChange = (value: string) => {
    setWeight(value)
    setHasSavedResult(false)
  }

  const calculateDose = () => {
    const numericWeight = Number.parseFloat(weight)
    if (Number.isNaN(numericWeight) || numericWeight <= 0) {
      setDose('')
      setHasSavedResult(false)
      return
    }

    const numericDose = numericWeight * 0.1
    setDose(formatMeasurement(numericDose))
    setHasSavedResult(false)
  }

  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const stored = window.localStorage.getItem(FAB_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as FabPosition
        setFabPosition(clampFabPosition(parsed))
        return
      }
    } catch {
      // Ignore malformed storage
    }

    setFabPosition(getDefaultFabPosition())
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleResize = () => {
      setFabPosition((prev) => {
        if (!prev) return prev
        const clamped = clampFabPosition(prev)
        if (clamped.x === prev.x && clamped.y === prev.y) {
          return prev
        }
        persistFabPosition(clamped)
        return clamped
      })
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
    }
  }, [])

  const handleFabPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    const currentPosition = fabPosition ?? getDefaultFabPosition()
    if (!fabPosition) {
      setFabPosition(currentPosition)
    }
    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origin: currentPosition,
      moved: false,
    }
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  const handleFabPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const dragState = dragStateRef.current
    if (!dragState || dragState.pointerId !== event.pointerId) return
    const deltaX = event.clientX - dragState.startX
    const deltaY = event.clientY - dragState.startY

    if (!dragState.moved) {
      const distance = Math.hypot(deltaX, deltaY)
      if (distance < 4) {
        return
      }
      dragState.moved = true
    }

    event.preventDefault()
    const nextPosition = clampFabPosition({
      x: dragState.origin.x + deltaX,
      y: dragState.origin.y + deltaY,
    })
    setFabPosition(nextPosition)
  }

  const handleFabPointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    const dragState = dragStateRef.current
    if (!dragState || dragState.pointerId !== event.pointerId) return
    event.preventDefault()
    event.currentTarget.releasePointerCapture?.(event.pointerId)
    dragStateRef.current = null

    if (dragState.moved && fabPosition) {
      suppressNextClickRef.current = true
      persistFabPosition(fabPosition)
      window.setTimeout(() => {
        suppressNextClickRef.current = false
      }, 50)
    }
  }

  const handleFabClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (suppressNextClickRef.current) {
      event.preventDefault()
      event.stopPropagation()
      return
    }
    onToggleDrawer()
  }

  const mobileFabStyle: CSSProperties = fabPosition
    ? {
        top: `${fabPosition.y}px`,
        left: `${fabPosition.x}px`,
      }
    : {
        right: '1rem',
        bottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))',
      }

  return (
    <>
      {/* Desktop Right Sidebar */}
      {!isCollapsed ? (
        <aside className="hidden lg:block w-[320px] border-l dark:border-neutral-700 bg-white dark:bg-neutral-800 overflow-auto">
          <div className="px-4 py-3 border-b dark:border-neutral-700 flex items-center justify-between">
            <div className="text-sm font-medium">Quick Tools</div>
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700"
                aria-label="Collapse tools panel"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="p-4 space-y-4">
              <DoseCalculator
                weight={weight}
                onWeightChange={handleWeightChange}
                dose={dose}
                calculateDose={calculateDose}
                hasSavedResult={hasSavedResult}
                onResultSaved={() => setHasSavedResult(true)}
              />
          </div>
        </aside>
      ) : (
        <div className="hidden lg:flex flex-col border-l dark:border-neutral-700 bg-white dark:bg-neutral-800">
          <button
            onClick={onToggleCollapse}
            className="p-3 hover:bg-neutral-100 dark:hover:bg-neutral-700 flex flex-col items-center gap-2 border-b dark:border-neutral-700"
            aria-label="Expand tools panel"
          >
            <Calculator className="h-5 w-5" />
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Mobile Drawer */}
      <div
        className={`lg:hidden fixed inset-x-0 bottom-0 z-40 pointer-events-none transition duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        aria-hidden={!isOpen}
      >
        <div
          className={`pointer-events-auto mx-4 sm:ml-auto sm:mr-4 sm:w-[min(420px,calc(100vw-2rem))] rounded-2xl border dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-2xl transform transition duration-300 ${
            isOpen ? 'translate-y-0' : 'translate-y-4'
          } max-h-[70vh] flex flex-col`}
          style={{ marginBottom: 'calc(4.5rem + env(safe-area-inset-bottom, 0px))' }}
        >
          <div className="sticky top-0 bg-white dark:bg-neutral-800 p-4 border-b dark:border-neutral-700 flex items-center justify-between rounded-t-2xl">
            <div className="flex items-center gap-2">
              <Syringe className="h-4 w-4" />
              <h3 className="font-semibold">Quick Tools</h3>
            </div>
            <button
              onClick={onRequestClose}
              className="rounded-lg p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700"
              aria-label="Close quick tools"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-4 space-y-4 overflow-auto">
              <DoseCalculator
                weight={weight}
                onWeightChange={handleWeightChange}
                dose={dose}
                calculateDose={calculateDose}
                hasSavedResult={hasSavedResult}
                onResultSaved={() => setHasSavedResult(true)}
              />
          </div>
        </div>
      </div>

        {/* Mobile Toggle Button */}
        <button
          onClick={handleFabClick}
          onPointerDown={handleFabPointerDown}
          onPointerMove={handleFabPointerMove}
          onPointerUp={handleFabPointerUp}
          className="lg:hidden fixed z-50 rounded-full border dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-lg p-4 flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 touch-none cursor-grab active:cursor-grabbing"
          style={mobileFabStyle}
          aria-label={`${isOpen ? 'Hide' : 'Show'} quick tools. Drag to reposition.`}
          title="Drag to reposition"
        >
          {isOpen ? <ChevronUp className="h-5 w-5" /> : <Syringe className="h-5 w-5" />}
        </button>
    </>
  )
}

function DoseCalculator({
  weight,
  onWeightChange,
  dose,
  calculateDose,
  hasSavedResult,
  onResultSaved,
}: {
  weight: string
  onWeightChange: (value: string) => void
  dose: string
  calculateDose: () => void
  hasSavedResult: boolean
  onResultSaved: () => void
}) {
  const { isMobile } = useReferenceCard()
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [calculationToSave, setCalculationToSave] = useState<CalculationData | null>(null)
  const formattedDoseDisplay = useMemo(() => (dose ? `${dose} mg` : ''), [dose])

  const handleSave = () => {
    if (!isMobile || !dose) return

    const calculation: CalculationData = {
      calculatorName: 'Dose Calculator',
      inputs: {
        Weight: `${formatMeasurement(Number.parseFloat(weight) || 0)} kg`,
      },
      outputs: {
        Dose: `${dose} mg`,
      },
    }

    setCalculationToSave(calculation)
    setShowSaveModal(true)
  }

  const handleCloseModal = () => {
    setShowSaveModal(false)
    setCalculationToSave(null)
  }

  const handleSaved = () => {
    onResultSaved()
    handleCloseModal()
  }

  return (
    <div className="rounded-2xl border dark:border-neutral-700 p-4">
      <h3 className="text-sm font-semibold mb-3">Dose Calculator</h3>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-neutral-600 dark:text-neutral-400 block mb-1">Weight (kg)</label>
          <input
            type="number"
            value={weight}
              onChange={(e) => onWeightChange(e.target.value)}
            className="w-full border dark:border-neutral-700 bg-transparent rounded px-3 py-2 text-sm focus:ring-2 focus:ring-red-600 outline-none"
            placeholder="Enter weight"
          />
        </div>

        <button
          onClick={calculateDose}
          className="w-full rounded-lg bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-sm font-medium transition-colors"
        >
          Calculate
        </button>

          {dose && (
          <div className="p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
            <div className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">Calculated Dose</div>
              <div className="text-lg font-semibold">{formattedDoseDisplay}</div>
          </div>
        )}

          {dose && isMobile && !hasSavedResult && (
          <button
            onClick={handleSave}
            className="w-full rounded-lg bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm font-medium transition-colors"
          >
            Save to Reference Card
          </button>
        )}
          {dose && hasSavedResult && (
            <div className="text-xs text-green-600 dark:text-green-400 font-medium">Saved to Quick Reference</div>
          )}
      </div>

      <div className="mt-4 pt-4 border-t dark:border-neutral-700">
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Example calculator. Real drug calculations will be added.
        </p>
      </div>

        {showSaveModal && calculationToSave && (
          <SaveCalculationModal calculation={calculationToSave} onClose={handleCloseModal} onSaved={handleSaved} />
        )}
    </div>
  )
}

function formatMeasurement(value: number): string {
  if (!Number.isFinite(value)) {
    return '0'
  }

  const fixed = value.toFixed(2)
  return fixed.replace(/\.?0+$/, '')
}
