/**
 * Callout Block configuration helpers.
 * Provides preset options and icon utilities used by the editor and frontend renderer.
 */

import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import {
  faBell,
  faCircleExclamation,
  faCircleInfo,
  faLightbulb,
  faLock,
  faPills,
  faStethoscope,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons'

export type CalloutIconId =
  | 'triangle-exclamation'
  | 'lock'
  | 'circle-exclamation'
  | 'circle-info'
  | 'lightbulb'
  | 'pills'
  | 'bell'
  | 'stethoscope'

export type CalloutVariant = 'callout' | 'alert'

const CALLOUT_ICONS: Record<CalloutIconId, IconDefinition> = {
  'triangle-exclamation': faTriangleExclamation,
  lock: faLock,
  'circle-exclamation': faCircleExclamation,
  'circle-info': faCircleInfo,
  lightbulb: faLightbulb,
  pills: faPills,
  bell: faBell,
  stethoscope: faStethoscope,
}

export interface CalloutPreset {
  id: string
  label: string
  description?: string
  icon: CalloutIconId
  color: string // Hex color
  variant: CalloutVariant
}

export const CALLOUT_PRESETS: Record<string, CalloutPreset> = {
  medicalControl: {
    id: 'medicalControl',
    label: 'Medical Control',
    description: 'Requires online medical direction',
    icon: 'stethoscope',
    color: '#f97316',
    variant: 'alert',
  },
  physicianOnly: {
    id: 'physicianOnly',
    label: 'Physician Only',
    description: 'Procedures reserved for a physician',
    icon: 'lock',
    color: '#6366f1',
    variant: 'alert',
  },
  medication: {
    id: 'medication',
    label: 'Medication Guidance',
    description: 'Important dosing or administration reminders',
    icon: 'pills',
    color: '#0ea5e9',
    variant: 'callout',
  },
  tip: {
    id: 'tip',
    label: 'Pearl / Best Practice',
    description: 'Helpful clinical tip or key reminder',
    icon: 'lightbulb',
    color: '#10b981',
    variant: 'callout',
  },
  notification: {
    id: 'notification',
    label: 'Notification',
    description: 'Non-critical notices or reminders',
    icon: 'bell',
    color: '#f59e0b',
    variant: 'callout',
  },
}

export type CalloutPresetId = keyof typeof CALLOUT_PRESETS

const LEGACY_PRESET_ALIASES: Record<string, CalloutPresetId> = {
  dosing: 'medication',
  warning: 'notification',
}

export const CALL_OUT_ICON_OPTIONS: Array<{
  id: CalloutIconId
  label: string
}> = [
  { id: 'triangle-exclamation', label: 'Warning' },
  { id: 'lock', label: 'Lock' },
  { id: 'circle-exclamation', label: 'Important' },
  { id: 'circle-info', label: 'Information' },
  { id: 'lightbulb', label: 'Idea / Tip' },
  { id: 'pills', label: 'Medication' },
  { id: 'bell', label: 'Notification' },
  { id: 'stethoscope', label: 'Medical' },
]

/**
 * Resolve an icon id to the FontAwesome icon definition.
 */
export function getCalloutIcon(id: CalloutIconId): IconDefinition {
  return CALLOUT_ICONS[id]
}

/**
 * Retrieve a preset by id.
 */
export function getCalloutPreset(id: string): CalloutPreset | undefined {
  const resolvedId = (CALLOUT_PRESETS[id as CalloutPresetId]
    ? (id as CalloutPresetId)
    : LEGACY_PRESET_ALIASES[id]) as CalloutPresetId | undefined

  if (!resolvedId) {
    return undefined
  }

  return CALLOUT_PRESETS[resolvedId]
}

/**
 * Build dropdown options for preset selection.
 */
export function getCalloutPresetOptions(): Array<{ value: string; label: string }> {
  return Object.values(CALLOUT_PRESETS).map((preset) => ({
    value: preset.id,
    label: preset.label,
  }))
}
