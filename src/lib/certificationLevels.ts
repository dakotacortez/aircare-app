/**
 * Certification level hierarchy and inline callouts for protocol content
 *
 * Two types of tags:
 * 1. Hierarchical cert levels (Basic → EMT → AEMT → ALS → CCT) - content filtered by user level
 * 2. Callouts (Medical Control, Physician Only) - always visible, just highlighted
 */

export const CERT_LEVELS = {
  basic: {
    value: 'basic',
    label: 'Basic/EMR',
    level: 0,
    color: '#6b7280', // gray
    description: 'Basic life support content',
    isCallout: false,
  },
  emt: {
    value: 'emt',
    label: 'EMT',
    level: 1,
    color: '#10b981', // green
    description: 'Emergency Medical Technician',
    isCallout: false,
  },
  aemt: {
    value: 'aemt',
    label: 'AEMT',
    level: 2,
    color: '#3b82f6', // blue
    description: 'Advanced Emergency Medical Technician',
    isCallout: false,
  },
  als: {
    value: 'als',
    label: 'ALS/Paramedic',
    level: 3,
    color: '#8b5cf6', // purple
    description: 'Advanced Life Support / Paramedic',
    isCallout: false,
  },
  cct: {
    value: 'cct',
    label: 'CCT',
    level: 4,
    color: '#ef4444', // red
    description: 'Critical Care Transport',
    isCallout: false,
  },
  medicalControl: {
    value: 'medicalControl',
    label: 'Medical Control',
    level: 999, // Always visible (not filtered)
    color: '#dc2626', // red-600
    description: 'Requires medical control authorization',
    isCallout: true,
  },
  physicianOnly: {
    value: 'physicianOnly',
    label: 'Physician Only',
    level: 999, // Always visible (not filtered)
    color: '#f59e0b', // amber
    description: 'Physician-only procedures',
    isCallout: true,
  },
} as const

export type CertLevelKey = keyof typeof CERT_LEVELS
export type CertLevel = (typeof CERT_LEVELS)[CertLevelKey]

/**
 * Determines if a user with a given certification level can view content
 * tagged with a specific certification level.
 *
 * Callouts (Medical Control, Physician Only) are always visible.
 *
 * @param userLevel - The user's certification level (0-4)
 * @param contentLevel - The content's required certification level (0-4 or 999 for callouts)
 * @returns true if user can view the content
 *
 * @example
 * canViewContent(4, 3) // true - CCT can see ALS content
 * canViewContent(2, 4) // false - AEMT cannot see CCT content
 * canViewContent(0, 999) // true - Everyone sees callouts (Medical Control, Physician Only)
 */
export function canViewContent(userLevel: number, contentLevel: number): boolean {
  // Callouts (level 999) are always visible
  if (contentLevel === 999) return true

  // Hierarchical filtering for cert levels
  return userLevel >= contentLevel
}

/**
 * Gets certification level data by key
 */
export function getCertLevel(key: CertLevelKey): CertLevel {
  return CERT_LEVELS[key]
}

/**
 * Gets all certification levels sorted by hierarchy
 */
export function getAllCertLevels(): CertLevel[] {
  return Object.values(CERT_LEVELS).sort((a, b) => a.level - b.level)
}

/**
 * Gets only hierarchical cert levels (excludes callouts)
 */
export function getCertLevelsOnly(): CertLevel[] {
  return Object.values(CERT_LEVELS)
    .filter((cert) => !cert.isCallout)
    .sort((a, b) => a.level - b.level)
}

/**
 * Gets only callout tags (Medical Control, Physician Only)
 */
export function getCallouts(): CertLevel[] {
  return Object.values(CERT_LEVELS).filter((cert) => cert.isCallout)
}

/**
 * Filters content levels that a user can edit/create
 * Users can only tag content at or below their level
 * But all users can add callouts
 */
export function getAvailableCertLevelsForUser(userLevel: number): CertLevel[] {
  return Object.values(CERT_LEVELS).filter(
    (cert) => cert.isCallout || cert.level <= userLevel
  )
}
