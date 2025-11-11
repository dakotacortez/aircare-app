/**
 * Callout Block Presets
 * Preset configurations for common protocol callout types
 */

import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import {
  faTriangleExclamation,
  faLock,
  faCircleExclamation,
  faCircleInfo,
  faLightbulb,
  faPills,
  faBell,
} from '@fortawesome/free-solid-svg-icons'

export interface CalloutPreset {
  id: string
  label: string
  icon: IconDefinition
  color: string // Hex color
  bgColor: string // Background color (light)
  darkBgColor: string // Background color (dark mode)
  borderColor: string // Border color
  darkBorderColor: string // Border color (dark mode)
}

export const CALLOUT_PRESETS: Record<string, CalloutPreset> = {
  medicalControl: {
    id: 'medicalControl',
    label: 'Medical Control',
    icon: faTriangleExclamation,
    color: '#d97706', // Amber 600
    bgColor: '#fef3c7', // Amber 100
    darkBgColor: '#78350f20', // Amber 900/20
    borderColor: '#f59e0b', // Amber 500
    darkBorderColor: '#d97706', // Amber 600
  },
  physicianOnly: {
    id: 'physicianOnly',
    label: 'Physician Only',
    icon: faLock,
    color: '#9333ea', // Purple 600
    bgColor: '#f3e8ff', // Purple 100
    darkBgColor: '#581c8720', // Purple 900/20
    borderColor: '#a855f7', // Purple 500
    darkBorderColor: '#9333ea', // Purple 600
  },
  important: {
    id: 'important',
    label: 'Important',
    icon: faCircleExclamation,
    color: '#dc2626', // Red 600
    bgColor: '#fee2e2', // Red 100
    darkBgColor: '#7f1d1d20', // Red 900/20
    borderColor: '#ef4444', // Red 500
    darkBorderColor: '#dc2626', // Red 600
  },
  note: {
    id: 'note',
    label: 'Note',
    icon: faCircleInfo,
    color: '#2563eb', // Blue 600
    bgColor: '#dbeafe', // Blue 100
    darkBgColor: '#1e3a8a20', // Blue 900/20
    borderColor: '#3b82f6', // Blue 500
    darkBorderColor: '#2563eb', // Blue 600
  },
  tip: {
    id: 'tip',
    label: 'Tip / Pearl',
    icon: faLightbulb,
    color: '#16a34a', // Green 600
    bgColor: '#dcfce7', // Green 100
    darkBgColor: '#14532d20', // Green 900/20
    borderColor: '#22c55e', // Green 500
    darkBorderColor: '#16a34a', // Green 600
  },
  dosing: {
    id: 'dosing',
    label: 'Dosing Info',
    icon: faPills,
    color: '#0891b2', // Cyan 600
    bgColor: '#cffafe', // Cyan 100
    darkBgColor: '#164e6320', // Cyan 900/20
    borderColor: '#06b6d4', // Cyan 500
    darkBorderColor: '#0891b2', // Cyan 600
  },
  warning: {
    id: 'warning',
    label: 'Warning',
    icon: faBell,
    color: '#ea580c', // Orange 600
    bgColor: '#ffedd5', // Orange 100
    darkBgColor: '#7c2d1220', // Orange 900/20
    borderColor: '#f97316', // Orange 500
    darkBorderColor: '#ea580c', // Orange 600
  },
}

export type CalloutPresetId = keyof typeof CALLOUT_PRESETS

/**
 * Get preset by ID
 */
export function getCalloutPreset(id: string): CalloutPreset | undefined {
  return CALLOUT_PRESETS[id as CalloutPresetId]
}

/**
 * Get all preset IDs and labels for dropdown
 */
export function getCalloutPresetOptions(): Array<{ value: string; label: string }> {
  return Object.values(CALLOUT_PRESETS).map((preset) => ({
    value: preset.id,
    label: preset.label,
  }))
}
