import { cn } from '@/utilities/ui'

type DoorCode = {
  label?: string | null
  code?: string | null
  notes?: string | null
  colorTheme?: string | null
  isPrimary?: boolean | null
}

interface DoorCodeListProps {
  doorCodes: DoorCode[]
  className?: string
}

export function DoorCodeList({ doorCodes, className }: DoorCodeListProps) {
  if (!doorCodes?.length) {
    return null
  }

  return (
    <div className={cn('grid grid-cols-1 gap-3 sm:grid-cols-2', className)}>
      {doorCodes.map((doorCode, idx) => {
        const label = doorCode?.label?.trim() || `Door Code ${idx + 1}`
        const code = doorCode?.code?.trim()
        if (!code) return null

        return (
          <article
            key={`${label}-${idx}`}
            className="rounded-xl bg-uc-light-subtle px-4 py-3 ring-1 ring-uc-light-border dark:bg-neutral-700 dark:ring-neutral-600"
          >
            <div className="flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.18em]">
              <p className="text-uc-text-light-muted dark:text-uc-text-dark-muted">{label}</p>
              {doorCode?.isPrimary && (
                <span className="rounded-full bg-white px-2 py-0.5 text-[0.55rem] font-semibold uppercase tracking-[0.18em] text-uc-text-light-default ring-1 ring-uc-light-border dark:bg-neutral-800 dark:text-uc-text-dark-default dark:ring-neutral-600">
                  Primary
                </span>
              )}
            </div>
            <p className="mt-2 font-mono text-2xl tracking-[0.2em] text-uc-text-light-default dark:text-white">{code}</p>
            {doorCode?.notes?.trim() && (
              <p className="mt-2 text-xs text-uc-text-light-muted dark:text-uc-text-dark-muted">{doorCode.notes.trim()}</p>
            )}
          </article>
        )
      })}
    </div>
  )
}
