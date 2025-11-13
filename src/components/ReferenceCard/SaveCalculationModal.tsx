'use client'

import React, { useState } from 'react'
import { useReferenceCard } from '@/hooks/useReferenceCard'
import type { CalculationData } from '@/types/referenceCard'
import { X, Calculator } from 'lucide-react'

interface SaveCalculationModalProps {
  calculation: CalculationData
  onClose: () => void
}

export const SaveCalculationModal: React.FC<SaveCalculationModalProps> = ({
  calculation,
  onClose,
}) => {
  const { cards, createCard, addEntryToCard } = useReferenceCard()
  const [selectedCard, setSelectedCard] = useState<string | null>(null)
  const [newCardName, setNewCardName] = useState('')
  const [mode, setMode] = useState<'existing' | 'new'>(cards.length > 0 ? 'existing' : 'new')

  const handleSave = () => {
    if (mode === 'existing' && !selectedCard) {
      alert('Please select a card')
      return
    }

    const cardId =
      mode === 'existing' && selectedCard ? selectedCard : createCard(newCardName || undefined)

    addEntryToCard(cardId, {
      type: 'calculation',
      calculatorName: calculation.calculatorName,
      inputs: calculation.inputs,
      outputs: calculation.outputs,
    })

    onClose()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl max-w-lg w-full">
        {/* Header */}
        <div className="border-b dark:border-neutral-700 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Save Calculation</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Preview */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
              {calculation.calculatorName}
            </p>
            <div className="text-xs text-neutral-600 dark:text-neutral-300 space-y-1">
              {Object.entries(calculation.outputs).map(([key, value]) => (
                <div key={key}>
                  • {key}: <strong>{String(value)}</strong>
                </div>
              ))}
            </div>
          </div>

          {/* Card selection */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={mode === 'existing'}
                onChange={() => setMode('existing')}
                disabled={cards.length === 0}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">Add to existing card</span>
            </label>

            {mode === 'existing' && (
              <select
                value={selectedCard || ''}
                onChange={(e) => setSelectedCard(e.target.value)}
                className="w-full px-3 py-2 border dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-sm"
                disabled={cards.length === 0}
              >
                <option value="">Select a card...</option>
                {cards.map((card) => (
                  <option key={card.id} value={card.id}>
                    {card.name} ({card.entries.length} entries)
                  </option>
                ))}
              </select>
            )}

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={mode === 'new'}
                onChange={() => setMode('new')}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">Create new card</span>
            </label>

            {mode === 'new' && (
              <input
                type="text"
                placeholder="Card name (optional)"
                value={newCardName}
                onChange={(e) => setNewCardName(e.target.value)}
                className="w-full px-3 py-2 border dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-sm"
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t dark:border-neutral-700 p-4 flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Save to Card
          </button>
        </div>
      </div>
    </div>
  )
}
