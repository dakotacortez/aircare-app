'use client'

import React, { useState } from 'react'
import { useReferenceCard } from '@/hooks/useReferenceCard'
import { SaveCalculationModal } from '@/components/ReferenceCard'
import type { CalculationData } from '@/types/referenceCard'
import { Calculator } from 'lucide-react'

export const PediatricDrugCalculator: React.FC = () => {
  const [weight, setWeight] = useState('')
  const [results, setResults] = useState<{
    rsi: { etomidate: string; succinylcholine: string }
    cardiacArrest: { epi: string; amiodarone: string }
    fluids: { bolus: string }
  } | null>(null)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [calculationToSave, setCalculationToSave] = useState<CalculationData | null>(null)
  const { isMobile } = useReferenceCard()

  const calculateAll = () => {
    const weightNum = parseFloat(weight)
    if (isNaN(weightNum) || weightNum <= 0) {
      alert('Please enter a valid weight')
      return
    }

    const etomidate = (weightNum * 0.2).toFixed(1)
    const etomidateMl = (parseFloat(etomidate) / 20).toFixed(2)
    const succinylcholine = (weightNum * 2).toFixed(0)
    const succinylcholineMl = (parseFloat(succinylcholine) / 20).toFixed(1)

    const epi = (weightNum * 0.01).toFixed(2)
    const epiMl = (parseFloat(epi) * 10).toFixed(1)
    const amiodarone = (weightNum * 5).toFixed(0)
    const amiodaroneMl = (parseFloat(amiodarone) / 50).toFixed(1)

    const fluidBolus = (weightNum * 20).toFixed(0)

    setResults({
      rsi: {
        etomidate: `${etomidate}mg (${etomidateMl}ml of 20mg/ml)`,
        succinylcholine: `${succinylcholine}mg (${succinylcholineMl}ml of 20mg/ml)`,
      },
      cardiacArrest: {
        epi: `${epi}mg (${epiMl}ml of 1:10,000)`,
        amiodarone: `${amiodarone}mg (${amiodaroneMl}ml of 50mg/ml)`,
      },
      fluids: {
        bolus: `${fluidBolus}ml`,
      },
    })
  }

  const handleSave = () => {
    if (!results) return

    const calculation: CalculationData = {
      calculatorName: 'Pediatric Critical Drugs',
      inputs: { weight: `${weight}kg` },
      outputs: {
        'Etomidate': results.rsi.etomidate,
        'Succinylcholine': results.rsi.succinylcholine,
        'Epinephrine': results.cardiacArrest.epi,
        'Amiodarone': results.cardiacArrest.amiodarone,
        'Fluid Bolus (20ml/kg)': results.fluids.bolus,
      },
    }

    setCalculationToSave(calculation)
    setShowSaveModal(true)
  }

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl border dark:border-neutral-700 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="h-5 w-5 text-purple-600" />
        <h3 className="text-lg font-semibold">Pediatric Critical Drugs</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Patient Weight (kg)</label>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && calculateAll()}
            placeholder="Enter weight in kg"
            className="w-full px-3 py-2 border dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900"
          />
        </div>

        <button
          onClick={calculateAll}
          className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Calculate All Doses
        </button>

        {results && (
          <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800 space-y-4">
            <div>
              <h4 className="font-semibold text-sm mb-2 text-purple-900 dark:text-purple-100">
                RSI Medications:
              </h4>
              <div className="space-y-1 text-sm ml-2">
                <div className="flex justify-between">
                  <span className="text-neutral-600 dark:text-neutral-300">• Etomidate:</span>
                  <strong>{results.rsi.etomidate}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600 dark:text-neutral-300">• Succinylcholine:</span>
                  <strong>{results.rsi.succinylcholine}</strong>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-2 text-purple-900 dark:text-purple-100">
                Cardiac Arrest:
              </h4>
              <div className="space-y-1 text-sm ml-2">
                <div className="flex justify-between">
                  <span className="text-neutral-600 dark:text-neutral-300">• Epinephrine:</span>
                  <strong>{results.cardiacArrest.epi}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600 dark:text-neutral-300">• Amiodarone:</span>
                  <strong>{results.cardiacArrest.amiodarone}</strong>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-2 text-purple-900 dark:text-purple-100">
                Fluids:
              </h4>
              <div className="space-y-1 text-sm ml-2">
                <div className="flex justify-between">
                  <span className="text-neutral-600 dark:text-neutral-300">• Bolus (20ml/kg):</span>
                  <strong>{results.fluids.bolus}</strong>
                </div>
              </div>
            </div>

            {isMobile ? (
              <button
                onClick={handleSave}
                className="w-full mt-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                Save All to Reference Card
              </button>
            ) : (
              <div className="mt-2 p-3 bg-neutral-100 dark:bg-neutral-700 rounded-lg text-xs text-center text-neutral-600 dark:text-neutral-300">
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
