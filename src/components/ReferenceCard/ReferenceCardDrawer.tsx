'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useReferenceCard } from '@/hooks/useReferenceCard'
import { ReferenceCardItem } from './ReferenceCardItem'
import { AddNoteModal } from './AddNoteModal'
import { FileText, X, Download, Trash2, Plus, EyeOff, Eye } from 'lucide-react'

export const ReferenceCardDrawer: React.FC = () => {
  const { cards, drawerOpen, setDrawerOpen, savedCount, clearAll, exportCards, isMobile } =
    useReferenceCard()
  const [showAddNote, setShowAddNote] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [fabDismissed, setFabDismissed] = useState(false)
  const [fabPosition, setFabPosition] = useState<{ x: number; y: number }>({ x: 16, y: 0 })
  const fabRef = useRef<HTMLDivElement | null>(null)

  const FAB_POSITION_KEY = 'acmc-reference-fab-position'
  const FAB_DISMISSED_KEY = 'acmc-reference-fab-dismissed'

  useEffect(() => {
    if (!isMobile) return

    try {
      const stored = localStorage.getItem(FAB_POSITION_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as { x: number; y: number }
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          setFabPosition(parsed)
        }
      } else {
        setFabPosition({
          x: 16,
          y: Math.max(16, window.innerHeight - 120),
        })
      }
    } catch {
      // ignore parse errors
    }

    const dismissed = localStorage.getItem(FAB_DISMISSED_KEY) === 'true'
    setFabDismissed(dismissed)
  }, [isMobile])

  useEffect(() => {
    if (!isMobile) return
    try {
      localStorage.setItem(FAB_POSITION_KEY, JSON.stringify(fabPosition))
    } catch {
      // ignore storage errors
    }
  }, [fabPosition, isMobile])

  useEffect(() => {
    if (!isMobile) return
    try {
      localStorage.setItem(FAB_DISMISSED_KEY, String(fabDismissed))
    } catch {
      // ignore storage errors
    }
  }, [fabDismissed, isMobile])

  const clamp = useCallback((value: number, min: number, max: number) => Math.min(Math.max(value, min), max), [])

  const handleFabPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if ((event.target as HTMLElement).closest('[data-no-drag="true"]')) {
        return
      }

      if (!fabRef.current) return

      const startX = event.clientX
      const startY = event.clientY
      const rect = fabRef.current.getBoundingClientRect()
      const initialPosition = { x: rect.left, y: rect.top }

      const handlePointerMove = (moveEvent: PointerEvent) => {
        const deltaX = moveEvent.clientX - startX
        const deltaY = moveEvent.clientY - startY
        const buttonWidth = fabRef.current?.offsetWidth ?? 64
        const buttonHeight = fabRef.current?.offsetHeight ?? 64
        const maxX = window.innerWidth - buttonWidth - 8
        const maxY = window.innerHeight - buttonHeight - 8

        setFabPosition({
          x: clamp(initialPosition.x + deltaX, 8, maxX),
          y: clamp(initialPosition.y + deltaY, 8, maxY),
        })
      }

      const handlePointerUp = () => {
        document.removeEventListener('pointermove', handlePointerMove)
        document.removeEventListener('pointerup', handlePointerUp)
      }

      document.addEventListener('pointermove', handlePointerMove)
      document.addEventListener('pointerup', handlePointerUp)
    },
    [clamp],
  )

  // Don't render on desktop
  if (!isMobile) return null

  const handleExport = (type: 'copy' | 'print' | 'email' | 'sms') => {
    const exportText = exportCards()

    switch (type) {
      case 'copy':
        navigator.clipboard
          .writeText(exportText)
          .then(() => alert('Copied to clipboard!'))
          .catch((err) => console.error('Copy failed:', err))
        break

      case 'print':
        const printWindow = window.open('', '_blank')
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>ACMC Reference Card</title>
                <style>
                  body { 
                    font-family: monospace; 
                    white-space: pre-wrap; 
                    padding: 20px;
                    max-width: 800px;
                    margin: 0 auto;
                  }
                  @media print {
                    body { padding: 0; }
                  }
                </style>
              </head>
              <body>${exportText}</body>
            </html>
          `)
          printWindow.document.close()
          printWindow.print()
        }
        break

      case 'email':
        const emailSubject = 'ACMC Reference Card'
        const emailBody = encodeURIComponent(exportText)
        window.location.href = `mailto:?subject=${emailSubject}&body=${emailBody}`
        break

      case 'sms':
        const smsBody = encodeURIComponent(exportText)
        window.location.href = `sms:?body=${smsBody}`
        break
    }

    setShowExportMenu(false)
  }

    return (
    <>
      {/* FAB - Only show when cards exist */}
        {savedCount > 0 && !fabDismissed && (
          <div
            ref={fabRef}
            className="fixed z-50 flex flex-col items-start gap-2 cursor-grab"
            style={{ left: fabPosition.x, top: fabPosition.y }}
            onPointerDown={handleFabPointerDown}
          >
          {/* Main FAB */}
          <button
            onClick={() => setDrawerOpen(!drawerOpen)}
            className="relative bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all"
            aria-label={drawerOpen ? 'Close reference cards' : 'Open reference cards'}
          >
            <FileText className="h-6 w-6" />
            <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full min-w-[1.5rem] h-6 px-1.5 flex items-center justify-center text-xs font-bold">
              {savedCount}
            </span>
          </button>

          {/* Add Note FAB - Show when drawer is open */}
          {drawerOpen && (
            <button
              onClick={() => setShowAddNote(true)}
              className="bg-green-600 hover:bg-green-700 text-white rounded-full p-3 shadow-lg transition-all animate-in fade-in slide-in-from-bottom-2 duration-200"
              aria-label="Add note"
                data-no-drag="true"
            >
              <Plus className="h-5 w-5" />
            </button>
          )}
            <button
              type="button"
              className="flex items-center gap-1 rounded-full border dark:border-neutral-700 bg-white/90 dark:bg-neutral-900/80 px-3 py-1 text-xs text-neutral-600 dark:text-neutral-300 shadow"
              onClick={() => setFabDismissed(true)}
              aria-label="Hide floating reference button"
              data-no-drag="true"
            >
              <EyeOff className="h-3.5 w-3.5" />
              Hide
            </button>
        </div>
      )}

      {/* Drawer */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 z-[45]"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="fixed bottom-0 left-0 right-0 sm:left-4 sm:right-auto sm:bottom-4 sm:w-[28rem] max-h-[85vh] bg-white dark:bg-neutral-800 rounded-t-2xl sm:rounded-2xl shadow-2xl z-50 flex flex-col animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-neutral-800 border-b dark:border-neutral-700 p-4 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold">Quick Reference ({savedCount})</h3>
              </div>
              <div className="flex items-center gap-1">
                  {fabDismissed && (
                    <button
                      onClick={() => {
                        setFabDismissed(false)
                        if (!savedCount) {
                          localStorage.removeItem(FAB_DISMISSED_KEY)
                        }
                      }}
                      className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                      aria-label="Show floating shortcut"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  )}
                {cards.length > 0 && (
                  <>
                    <div className="relative">
                      <button
                        onClick={() => setShowExportMenu(!showExportMenu)}
                        className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                        aria-label="Export options"
                      >
                        <Download className="h-4 w-4" />
                      </button>

                      {/* Export Menu */}
                      {showExportMenu && (
                        <div className="absolute right-0 top-full mt-1 bg-white dark:bg-neutral-700 border dark:border-neutral-600 rounded-lg shadow-lg py-1 min-w-[140px] z-10">
                          <button
                            onClick={() => handleExport('copy')}
                            className="w-full px-4 py-2 text-sm text-left hover:bg-neutral-100 dark:hover:bg-neutral-600"
                          >
                            Copy to Clipboard
                          </button>
                          <button
                            onClick={() => handleExport('print')}
                            className="w-full px-4 py-2 text-sm text-left hover:bg-neutral-100 dark:hover:bg-neutral-600"
                          >
                            Print
                          </button>
                          <button
                            onClick={() => handleExport('email')}
                            className="w-full px-4 py-2 text-sm text-left hover:bg-neutral-100 dark:hover:bg-neutral-600"
                          >
                            Email
                          </button>
                          <button
                            onClick={() => handleExport('sms')}
                            className="w-full px-4 py-2 text-sm text-left hover:bg-neutral-100 dark:hover:bg-neutral-600"
                          >
                            Text (SMS)
                          </button>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={clearAll}
                      className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors text-red-600"
                      aria-label="Clear all cards"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}

                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {cards.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-12 w-12 text-neutral-300 dark:text-neutral-600 mb-3" />
                  <p className="text-neutral-500 dark:text-neutral-400 mb-4">
                    No saved reference cards
                  </p>
                  <button
                    onClick={() => setShowAddNote(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add Your First Note
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {cards.map((card) => (
                    <ReferenceCardItem key={card.id} card={card} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Modals */}
      {showAddNote && <AddNoteModal onClose={() => setShowAddNote(false)} />}
    </>
  )
}
