/**
 * Calculator Registry
 * 
 * Maps calculator keys (from the calculators collection) to React components.
 * Each calculator component should implement the logic for a specific clinical tool.
 * 
 * Example usage:
 * import { calculatorRegistry } from './registry'
 * const CalculatorComponent = calculatorRegistry['weightBasedDosing']
 */

import React from 'react'

/**
 * Calculator component props
 * All calculators should accept these common props
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface CalculatorProps {
  // Add common props here as needed
  // e.g., protocolId?: string
  // e.g., serviceLine?: string
}

/**
 * Type for calculator keys
 * As you implement calculators, add their keys here
 */
export type CalculatorKey = string

/**
 * Registry type mapping keys to React components
 */
export type CalculatorRegistry = {
  [key in CalculatorKey]?: React.ComponentType<CalculatorProps>
}

/**
 * Calculator Registry
 * 
 * TODO: Implement calculator components and register them here
 * 
 * Example:
 * export const calculatorRegistry: CalculatorRegistry = {
 *   weightBasedDosing: WeightBasedDosingCalculator,
 *   rsiChecklist: RSIChecklistCalculator,
 *   ventilatorSettings: VentilatorSettingsCalculator,
 * }
 */
export const calculatorRegistry: CalculatorRegistry = {
  // TODO: Add calculator implementations here
  // Example:
  // 'weight-based-dosing': WeightBasedDosingCalculator,
}

/**
 * Get a calculator component by key
 * @param key - The calculator key from the database
 * @returns The calculator component or undefined if not found
 */
export function getCalculator(key: string): React.ComponentType<CalculatorProps> | undefined {
  return calculatorRegistry[key]
}

/**
 * Check if a calculator is implemented
 * @param key - The calculator key from the database
 * @returns True if the calculator is implemented
 */
export function hasCalculator(key: string): boolean {
  return key in calculatorRegistry && calculatorRegistry[key] !== undefined
}
