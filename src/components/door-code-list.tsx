'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { cn } from '@/utilities/ui'

type DoorCode = {
  label?: string | null
  code?: string | null
  notes?: string | null
}

interface DoorCodeListProps {
  doorCodes: DoorCode[]
  className?: string
}

export function DoorCodeList({ doorCodes, className }: DoorCodeListProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current)
      }
    }
  }, [])

  const handleCopy = async (code: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedIndex(idx)

      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current)
      }

      copyTimeoutRef.current = setTimeout(() => {
        setCopiedIndex((current) => (current === idx ? null : current))
      }, 2000)
    } catch (error) {
      console.error('Unable to copy door code', error)
    }
  }

  if (!doorCodes?.length) {
    return null
  }

  return (
    <div className={cn('grid grid-cols-1 gap-3 sm:grid-cols-2', className)}>
      {doorCodes.map((doorCode, idx) => {
        const label = doorCode?.label?.trim() || `Door Code ${idx + 1}`
        const code = doorCode?.code?.trim()

        if (!code) {
          return null
        }

        return (
          <article
            key={`${label}-${idx}`}
            className="group relative overflow-hidden rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50/80 via-white to-amber-100/70 p-4 shadow-[0_15px_35px_-20px_rgba(194,65,12,0.9)] transition duration-300 hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-[0_25px_45px_-25px_rgba(194,65,12,1)] dark:border-amber-900/70 dark:from-amber-950/30 dark:via-amber-900/20 dark:to-amber-950/10 dark:shadow-[0_25px_45px_-35px_rgba(0,0,0,0.8)] dark:hover:border-amber-800"
          >
            <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100">
              <div className="absolute -top-16 right-4 h-32 w-32 rounded-full bg-amber-400/20 blur-3xl dark:bg-amber-500/10" />
            </div>

            <div className="relative flex items-start justify-between gap-3">
              <div>
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-amber-800/80 dark:text-amber-100/70">
                  {label}
                </p>
                <p className="mt-2 font-mono text-xl tracking-tight text-amber-950 dark:text-amber-50">
                  {code}
                </p>
                {doorCode?.notes?.trim() && (
                  <p className="mt-2 text-xs text-amber-900/70 dark:text-amber-100/70">
                    {doorCode.notes.trim()}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleCopy(code, idx)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-amber-300/70 bg-white/90 text-amber-800 shadow-sm transition hover:scale-105 hover:bg-white dark:border-amber-800/40 dark:bg-amber-900/30 dark:text-amber-50"
                aria-label={`Copy ${label}`}
              >
                {copiedIndex === idx ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </article>
        )
      })}
    </div>
  )
}
