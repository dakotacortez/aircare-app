'use client'

import React, { useState } from 'react'
import { useReferenceCard } from '@/hooks/useReferenceCard'
import { X, FileText } from 'lucide-react'

interface AddNoteModalProps {
  onClose: () => void
}

export const AddNoteModal: React.FC<AddNoteModalProps> = ({ onClose }) => {
  const { cards, createCard, addEntryToCard } = useReferenceCard()
  const [selectedCard, setSelectedCard] = useState<string | null>(null)
  const [newCardName, setNewCardName] = useState('')
  const [mode, setMode] = useState<'existing' | 'new'>(cards.length > 0 ? 'existing' : 'new')
  const [timeAction, setTimeAction] = useState('')
  const [noteText, setNoteText] = useState('')

  const handleSave = () => {
    if (!noteText.trim()) {
      alert('Please enter note text')
      return
    }

    const cardId =
      mode === 'existing' && selectedCard ? selectedCard : createCard(newCardName || undefined)

    addEntryToCard(cardId, {
      type: 'note',
      timeAction: timeAction.trim() || undefined,
      noteText: noteText.trim(),
    })

    onClose()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-neutral-800 border-b dark:border-neutral-700 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Add Note</h3>
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

          <hr className="border-neutral-200 dark:border-neutral-700" />

          {/* Note fields */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Time/Action <span className="text-neutral-500">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g., 14:30 - Gave fluid bolus"
                value={timeAction}
                onChange={(e) => setTimeAction(e.target.value)}
                className="w-full px-3 py-2 border dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Note <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                placeholder="Enter your note..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="w-full px-3 py-2 border dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-sm resize-none"
              />
            </div>
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
            Save Note
          </button>
        </div>
      </div>
    </div>
  )
}
