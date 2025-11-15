// Type for calculator input/output values
export type CalculatorValue = string | number | boolean

export interface ReferenceCard {
  id: string // UUID
  name: string // User-provided or "Card - 14:30"
  createdAt: number // Timestamp of first entry
  expiresAt: number // createdAt + 24 hours (86400000ms)
  entries: CardEntry[]
}

export interface CardEntry {
  id: string // UUID
  type: 'calculation' | 'note'
  timestamp: number // When entry was created

  // For calculations
  calculatorName?: string // "Ventilator Settings", "Peds Critical Drugs"
  inputs?: Record<string, CalculatorValue> // { weight: 80 }
  outputs?: Record<string, CalculatorValue> // { tidalVolume: "560ml", rate: "12bpm" }

  // For notes
  timeAction?: string // "14:30 - Gave fluid bolus"
  noteText?: string // "360ml NS given"

  // Optional authorization context
  authLevel?: 'medical-control' | 'physician-only'
}

export type CalculationData = {
  calculatorName: string
  inputs: Record<string, CalculatorValue>
  outputs: Record<string, CalculatorValue>
}
