'use client'
import React, { useState } from 'react'
import { Syringe, X, ChevronUp, Calculator, ChevronLeft, ChevronRight } from 'lucide-react'

interface ProtocolToolsProps {
  isOpen: boolean
  onClose: () => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export function ProtocolTools({ isOpen, onClose, isCollapsed = false, onToggleCollapse }: ProtocolToolsProps) {
  const [weight, setWeight] = useState('')
  const [dose, setDose] = useState('')

  const calculateDose = () => {
    if (weight) {
      // Example calculation - you'll add real drug calculations later
      const result = (parseFloat(weight) * 0.1).toFixed(2)
      setDose(result)
    }
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
            <DoseCalculator weight={weight} setWeight={setWeight} dose={dose} calculateDose={calculateDose} />
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

      {/* Mobile Bottom Drawer */}
      <div className={`lg:hidden fixed inset-x-0 bottom-0 z-50 bg-white dark:bg-neutral-800 border-t dark:border-neutral-700 rounded-t-2xl transform transition-transform duration-300 ${
        isOpen ? 'translate-y-0' : 'translate-y-full'
      } max-h-[85vh] overflow-auto`}>
        <div className="sticky top-0 bg-white dark:bg-neutral-800 p-4 border-b dark:border-neutral-700">
          <div className="w-12 h-1 bg-neutral-300 dark:bg-neutral-600 rounded-full mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Quick Tools</h3>
            <button 
              onClick={onClose} 
              className="rounded-lg p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <div className="p-4 space-y-4">
          <DoseCalculator weight={weight} setWeight={setWeight} dose={dose} calculateDose={calculateDose} />
        </div>
      </div>

      {/* Mobile Tools Button */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white dark:from-neutral-900 pt-8 pb-4 px-4 pointer-events-none">
        <button 
          onClick={() => onClose()} 
          className="w-full rounded-xl border dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-3 flex items-center justify-between shadow-lg pointer-events-auto hover:bg-neutral-50 dark:hover:bg-neutral-700"
        >
          <span className="font-medium flex items-center gap-2">
            <Syringe className="h-4 w-4" />
            Quick Tools
          </span>
          <ChevronUp className="h-5 w-5" />
        </button>
      </div>
    </>
  )
}

function DoseCalculator({ 
  weight, 
  setWeight, 
  dose, 
  calculateDose 
}: { 
  weight: string
  setWeight: (value: string) => void
  dose: string
  calculateDose: () => void
}) {
  return (
    <div className="rounded-2xl border dark:border-neutral-700 p-4">
      <h3 className="text-sm font-semibold mb-3">Dose Calculator</h3>
      
      <div className="space-y-3">
        <div>
          <label className="text-xs text-neutral-600 dark:text-neutral-400 block mb-1">
            Weight (kg)
          </label>
          <input 
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
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
            <div className="text-lg font-semibold">{dose} mg</div>
          </div>
        )}
      </div>
      
      <div className="mt-4 pt-4 border-t dark:border-neutral-700">
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Example calculator. Real drug calculations will be added.
        </p>
      </div>
    </div>
  )
}
