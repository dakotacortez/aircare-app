'use client'

import React, { useState, useEffect } from 'react'
import type { ReferenceCard } from '@/types/referenceCard'
import { CardEntryItem } from './CardEntryItem'
import { useReferenceCard, formatTimeAgo } from '@/hooks/useReferenceCard'
import { ChevronDown, ChevronRight, Trash2 } from 'lucide-react'

interface ReferenceCardItemProps {
  card: ReferenceCard
}

export const ReferenceCardItem: React.FC<ReferenceCardItemProps> = ({ card }) => {
  const [expanded, setExpanded] = useState(true)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const { deleteCard, deleteEntry } = useReferenceCard()

  // Auto-cancel delete confirmation after 3 seconds
  useEffect(() => {
    if (confirmingDelete) {
      const timeout = setTimeout(() => setConfirmingDelete(false), 3000)
      return () => clearTimeout(timeout)
    }
  }, [confirmingDelete])

  const handleDelete = () => {
    if (confirmingDelete) {
      deleteCard(card.id)
    } else {
      setConfirmingDelete(true)
    }
  }

  return (
    <div className="border dark:border-neutral-700 rounded-lg mb-3 overflow-hidden bg-white dark:bg-neutral-800">
      {/* Header */}
      <div className="p-3 bg-neutral-50 dark:bg-neutral-700/50 flex items-center gap-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded"
          aria-label={expanded ? 'Collapse card' : 'Expand card'}
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
        <h4 className="flex-1 font-semibold text-sm">{card.name}</h4>
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          {formatTimeAgo(card.createdAt)}
        </span>
        <button
          onClick={handleDelete}
          className={`p-1 rounded transition-colors ${
            confirmingDelete
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-600'
          }`}
          aria-label={confirmingDelete ? 'Confirm delete' : 'Delete card'}
        >
          {confirmingDelete ? (
            <span className="text-xs px-1">Confirm?</span>
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Entries */}
      {expanded && (
        <div className="p-3 space-y-2">
          {card.entries.length === 0 ? (
            <p className="text-sm text-neutral-500 dark:text-neutral-400 italic">
              No entries yet
            </p>
          ) : (
            card.entries.map((entry) => (
              <CardEntryItem
                key={entry.id}
                entry={entry}
                onDelete={() => deleteEntry(card.id, entry.id)}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}
