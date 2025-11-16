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
  }
> = {
  sunset:
    'from-amber-50/90 via-white to-orange-50 border-amber-100 text-amber-900 dark:from-amber-950/20 dark:via-black/20 dark:to-amber-900/10 dark:border-amber-900/40',
  slate:
    'from-slate-50 via-white to-slate-100 border-slate-200 text-slate-900 dark:from-slate-900/30 dark:via-black/20 dark:to-slate-900/20 dark:border-slate-800',
  sky: 'from-sky-50 via-white to-cyan-50 border-sky-100 text-sky-900 dark:from-sky-950/20 dark:border-sky-900/50',
  emerald:
    'from-emerald-50 via-white to-emerald-100 border-emerald-100 text-emerald-900 dark:from-emerald-950/20 dark:border-emerald-900/40',
  violet:
    'from-violet-50 via-white to-fuchsia-50 border-violet-100 text-violet-900 dark:from-violet-950/20 dark:border-violet-900/40',
  rose: 'from-rose-50 via-white to-rose-100 border-rose-100 text-rose-900 dark:from-rose-950/20 dark:border-rose-900/40',
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
                'group relative overflow-hidden rounded-2xl border bg-gradient-to-br p-4 shadow-[0_20px_45px_-30px_rgba(15,23,42,0.8)] transition duration-300 hover:-translate-y-0.5',
                baseTheme,
              )}
            >
              <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100">
                <div className="absolute -top-16 right-4 h-32 w-32 rounded-full bg-white/20 blur-3xl dark:bg-white/5" />
              </div>
              <div className="relative">
                <div className="flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.2em]">
                  <p className="text-slate-700/80 dark:text-white/70">{label}</p>
                  {doorCode?.isPrimary && (
                    <span className="rounded-full bg-white/70 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-slate-800 shadow-sm dark:bg-white/20 dark:text-white">
                      Primary
                    </span>
                  )}
                </div>
                <p className="mt-2 font-mono text-2xl tracking-[0.2em] text-slate-900 dark:text-white">
                  {code}
                </p>
                {doorCode?.notes?.trim() && (
                  <p className="mt-2 text-xs text-slate-700/80 dark:text-white/80">{doorCode.notes.trim()}</p>
                )}
              </div>
            </article>
          )
        })}
    </div>
  )
}
