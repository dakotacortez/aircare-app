import { cn } from '@/utilities/ui'

type DoorCode = {
  label?: string | null
  code?: string | null
  notes?: string | null
  colorTheme?: string | null
  isPrimary?: boolean | null
}

const colorThemes: Record<
  string,
  {
    wrapper: string
    labelText: string
    shadow: string
  }
> = {
  sunset: {
    wrapper:
      'from-amber-50 to-orange-50 ring-orange-100 text-orange-600 dark:from-amber-900/20 dark:to-orange-900/10 dark:ring-orange-800/60',
    labelText: 'text-orange-500 dark:text-orange-300',
    shadow: 'shadow-[0_10px_25px_-20px_rgba(249,115,22,0.8)]',
  },
  slate: {
    wrapper:
      'from-slate-50 to-slate-100 ring-slate-200 text-slate-700 dark:from-slate-900/20 dark:to-slate-900/10 dark:ring-slate-700',
    labelText: 'text-slate-500 dark:text-slate-300',
    shadow: 'shadow-[0_10px_25px_-20px_rgba(15,23,42,0.8)]',
  },
  sky: {
    wrapper:
      'from-sky-50 to-cyan-50 ring-sky-100 text-sky-700 dark:from-sky-900/20 dark:to-cyan-900/10 dark:ring-sky-900/60',
    labelText: 'text-sky-500 dark:text-sky-300',
    shadow: 'shadow-[0_10px_25px_-20px_rgba(14,165,233,0.8)]',
  },
  emerald: {
    wrapper:
      'from-emerald-50 to-emerald-100 ring-emerald-100 text-emerald-700 dark:from-emerald-900/20 dark:to-emerald-900/10 dark:ring-emerald-900/40',
    labelText: 'text-emerald-500 dark:text-emerald-300',
    shadow: 'shadow-[0_10px_25px_-20px_rgba(5,150,105,0.8)]',
  },
  violet: {
    wrapper:
      'from-violet-50 to-fuchsia-50 ring-violet-100 text-violet-700 dark:from-violet-900/20 dark:to-fuchsia-900/10 dark:ring-violet-900/40',
    labelText: 'text-violet-500 dark:text-violet-300',
    shadow: 'shadow-[0_10px_25px_-20px_rgba(139,92,246,0.8)]',
  },
  rose: {
    wrapper:
      'from-rose-50 to-rose-100 ring-rose-100 text-rose-700 dark:from-rose-900/20 dark:to-rose-900/10 dark:ring-rose-900/40',
    labelText: 'text-rose-500 dark:text-rose-300',
    shadow: 'shadow-[0_10px_25px_-20px_rgba(244,63,94,0.7)]',
  },
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

        const themeKey = doorCode?.colorTheme ?? 'sunset'
        const baseTheme = colorThemes[themeKey] ?? colorThemes.sunset

        return (
          <article
            key={`${label}-${idx}`}
            className={cn(
              'rounded-2xl bg-gradient-to-br px-4 py-3 ring-1 transition-colors',
              baseTheme.wrapper,
              baseTheme.shadow,
            )}
          >
            <div className="flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.18em]">
              <p className={cn('text-uc-text-light-muted dark:text-uc-text-dark-muted', baseTheme.labelText)}>{label}</p>
              {doorCode?.isPrimary && (
                <span className="rounded-full bg-white/70 px-2 py-0.5 text-[0.55rem] font-semibold uppercase tracking-[0.18em] text-uc-text-light-default shadow-sm dark:bg-white/10 dark:text-uc-text-dark-default">
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
