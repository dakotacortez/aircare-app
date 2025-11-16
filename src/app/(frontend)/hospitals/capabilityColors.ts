export const capabilityColors = {
  trauma: {
    pill: 'bg-rose-50 text-rose-700 ring-rose-100',
    text: 'text-rose-700',
    tooltip: 'bg-slate-900 text-white',
  },
  cardiac: {
    pill: 'bg-amber-50 text-amber-700 ring-amber-100',
    text: 'text-amber-700',
    tooltip: 'bg-slate-900 text-white',
  },
  neuro: {
    pill: 'bg-sky-50 text-sky-700 ring-sky-100',
    text: 'text-sky-700',
    tooltip: 'bg-slate-900 text-white',
  },
  obstetrics: {
    pill: 'bg-purple-50 text-purple-700 ring-purple-100',
    text: 'text-purple-700',
    tooltip: 'bg-slate-900 text-white',
  },
  other: {
    pill: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    text: 'text-emerald-700',
    tooltip: 'bg-slate-900 text-white',
  },
} as const

export type CapabilityColorKey = keyof typeof capabilityColors
export type CapabilityColorToken = (typeof capabilityColors)[CapabilityColorKey]
