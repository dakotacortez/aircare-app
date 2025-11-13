/**
 * Certification level hierarchy and inline callouts for protocol content.
 *
 * Current service lines:
 *  - BLS (Basic Life Support)
 *  - ALS (Advanced Life Support)
 *  - CCT (Critical Care Transport)
 *
 * Legacy inline tags are kept for backwards compatibility but hidden from the editor UI.
 */

export const CERT_LEVELS = {
  bls: {
    value: 'bls',
    label: 'BLS',
    level: 0,
    color: '#10b981', // emerald
    description: 'Basic Life Support service line',
    isCallout: false,
    isSelectable: true,
  },
  als: {
    value: 'als',
    label: 'ALS',
    level: 1,
    color: '#6366f1', // indigo
    description: 'Advanced Life Support service line',
    isCallout: false,
    isSelectable: true,
  },
  cct: {
    value: 'cct',
    label: 'CCT',
    level: 2,
    color: '#ef4444', // red
    description: 'Critical Care Transport service line',
    isCallout: false,
    isSelectable: true,
  },
  basic: {
    value: 'basic',
    label: 'Basic/EMR',
    level: 0,
    color: '#6b7280',
    description: 'Legacy basic level (maps to BLS)',
    isCallout: false,
    isSelectable: false,
  },
  emt: {
    value: 'emt',
    label: 'EMT',
    level: 0,
    color: '#0d9488',
    description: 'Legacy EMT level (maps to BLS)',
    isCallout: false,
    isSelectable: false,
  },
  aemt: {
    value: 'aemt',
    label: 'AEMT',
    level: 0,
    color: '#3b82f6',
    description: 'Legacy AEMT level (maps to BLS)',
    isCallout: false,
    isSelectable: false,
  },
  medicalControl: {
    value: 'medicalControl',
    label: 'Medical Control',
    level: 999,
    color: '#dc2626',
    description: 'Legacy tag — use an Alert callout instead',
    isCallout: true,
    isSelectable: false,
  },
  physicianOnly: {
    value: 'physicianOnly',
    label: 'Physician Only',
    level: 999,
    color: '#f59e0b',
    description: 'Legacy tag — use an Alert callout instead',
    isCallout: true,
    isSelectable: false,
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
  return Object.values(CERT_LEVELS)
    .filter((cert) => cert.isSelectable)
    .sort((a, b) => a.level - b.level)
}

/**
 * Gets only hierarchical cert levels (excludes callouts)
 */
export function getCertLevelsOnly(): CertLevel[] {
  return Object.values(CERT_LEVELS)
    .filter((cert) => !cert.isCallout && cert.isSelectable)
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
    (cert) => cert.isCallout || (cert.isSelectable && cert.level <= userLevel)
  )
}
