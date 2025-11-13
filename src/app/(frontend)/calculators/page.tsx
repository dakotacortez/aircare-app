import React from 'react'
import { VentilatorCalculator, PediatricDrugCalculator } from '@/components/Calculators'
import { Calculator } from 'lucide-react'

export default function CalculatorsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <Calculator className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-3xl font-bold">Medical Calculators</h1>
        </div>
        <p className="text-neutral-600 dark:text-neutral-400">
          Quick reference calculators for critical care scenarios. Results can be saved to your
          reference card on mobile/tablet devices.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <VentilatorCalculator />
        <PediatricDrugCalculator />
      </div>

      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
        <h2 className="font-semibold text-sm mb-2 text-blue-900 dark:text-blue-100">
          💡 Quick Reference Cards
        </h2>
        <p className="text-sm text-neutral-700 dark:text-neutral-200">
          On mobile/tablet devices, you can save calculation results to your quick reference card
          for easy access during patient care. Cards are stored locally for 24 hours and work
          offline.
        </p>
      </div>
    </div>
  )
}

export const metadata = {
  title: 'Medical Calculators | ACMC',
  description:
    'Quick reference medical calculators for ventilator settings, drug doses, and critical care scenarios.',
}
