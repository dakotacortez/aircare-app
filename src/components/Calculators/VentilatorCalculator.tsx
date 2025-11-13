'use client'

import React, { useState } from 'react'
import { useReferenceCard } from '@/hooks/useReferenceCard'
import { SaveCalculationModal } from '@/components/ReferenceCard'
import type { CalculationData } from '@/types/referenceCard'
import { Calculator } from 'lucide-react'

export const VentilatorCalculator: React.FC = () => {
  const [weight, setWeight] = useState('')
  const [results, setResults] = useState<{
    tidalVolume: string
    rate: string
    minuteVolume: string
  } | null>(null)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [calculationToSave, setCalculationToSave] = useState<CalculationData | null>(null)
  const { isMobile } = useReferenceCard()

  const calculate = () => {
    const weightNum = parseFloat(weight)
    if (isNaN(weightNum) || weightNum <= 0) {
      alert('Please enter a valid weight')
      return
    }

    const tidalVolume = Math.round(weightNum * 7)
    const rate = 12
    const minuteVolume = ((tidalVolume * rate) / 1000).toFixed(2)

    setResults({
      tidalVolume: `${tidalVolume}ml`,
      rate: `${rate} bpm`,
      minuteVolume: `${minuteVolume} L/min`,
    })
  }

  const handleSave = () => {
    if (!results) return

    const calculation: CalculationData = {
      calculatorName: 'Ventilator Settings',
      inputs: { weight: `${weight}kg` },
      outputs: results,
    }

    setCalculationToSave(calculation)
    setShowSaveModal(true)
  }

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl border dark:border-neutral-700 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Ventilator Settings</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Patient Weight (kg)</label>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && calculate()}
            placeholder="Enter weight in kg"
            className="w-full px-3 py-2 border dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900"
          />
        </div>

        <button
          onClick={calculate}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Calculate
        </button>

        {results && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-sm mb-3 text-blue-900 dark:text-blue-100">
              Results:
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-600 dark:text-neutral-300">Tidal Volume:</span>
                <strong>{results.tidalVolume}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600 dark:text-neutral-300">Rate:</span>
                <strong>{results.rate}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600 dark:text-neutral-300">Minute Volume:</span>
                <strong>{results.minuteVolume}</strong>
              </div>
            </div>

            {isMobile ? (
              <button
                onClick={handleSave}
                className="w-full mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                Save to Reference Card
              </button>
            ) : (
              <div className="mt-4 p-3 bg-neutral-100 dark:bg-neutral-700 rounded-lg text-xs text-center text-neutral-600 dark:text-neutral-300">
                💡 Reference cards are available on mobile/tablet devices
              </div>
            )}
          </div>
        )}
      </div>

      {showSaveModal && calculationToSave && (
        <SaveCalculationModal
          calculation={calculationToSave}
          onClose={() => setShowSaveModal(false)}
        />
      )}
    </div>
  )
}
