'use client'

import React, { useState } from 'react'
import type { CardEntry } from '@/types/referenceCard'
import { formatTimeAgo } from '@/hooks/useReferenceCard'
import { Calculator, FileText, Copy, Check } from 'lucide-react'

interface CardEntryItemProps {
  entry: CardEntry
  onDelete: () => void
}

export const CardEntryItem: React.FC<CardEntryItemProps> = ({ entry }) => {
  const [copiedValue, setCopiedValue] = useState<string | null>(null)

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedValue(key)
      setTimeout(() => setCopiedValue(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  if (entry.type === 'calculation') {
    return (
      <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500">
        <div className="flex items-start gap-2 mb-2">
          <Calculator className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <strong className="text-sm font-semibold text-blue-900 dark:text-blue-100">
              {entry.calculatorName}
            </strong>
            <span className="text-xs text-neutral-500 dark:text-neutral-400 ml-2">
              {formatTimeAgo(entry.timestamp)}
            </span>
          </div>
        </div>

        {entry.inputs && Object.keys(entry.inputs).length > 0 && (
          <div className="mb-2 text-xs text-neutral-600 dark:text-neutral-300">
            {Object.entries(entry.inputs).map(([key, value]) => (
              <span key={key} className="mr-3">
                {key}: <strong>{String(value)}</strong>
              </span>
            ))}
          </div>
        )}

        {entry.outputs && (
          <div className="space-y-1">
            {Object.entries(entry.outputs).map(([key, value]) => {
              const valueStr = String(value)
              const isCopied = copiedValue === key
              return (
                <div
                  key={key}
                  className="flex items-center justify-between text-sm bg-white dark:bg-neutral-800 rounded px-2 py-1.5"
                >
                  <span className="text-neutral-700 dark:text-neutral-200">
                    • {key}: <strong>{valueStr}</strong>
                  </span>
                  <button
                    onClick={() => copyToClipboard(valueStr, key)}
                    className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors"
                    aria-label={`Copy ${key}`}
                  >
                    {isCopied ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3 text-neutral-400" />
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // Note entry
  return (
    <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-700/50 border-l-4 border-neutral-400">
      <div className="flex items-start gap-2 mb-1">
        <FileText className="h-4 w-4 text-neutral-600 dark:text-neutral-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          {entry.timeAction && (
            <strong className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {entry.timeAction}
            </strong>
          )}
          {!entry.timeAction && (
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              Note added {formatTimeAgo(entry.timestamp)}
            </span>
          )}
        </div>
      </div>
      <p className="text-sm text-neutral-700 dark:text-neutral-200 whitespace-pre-wrap ml-6">
        {entry.noteText}
      </p>
    </div>
  )
}
