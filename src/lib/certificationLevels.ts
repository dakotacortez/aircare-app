/**
 * Certification level hierarchy for protocol content visibility
 * Higher levels can see all content from lower levels
 */

export const CERT_LEVELS = {
  basic: {
    value: 'basic',
    label: 'Basic/EMR',
    level: 0,
    color: '#6b7280', // gray
    description: 'Basic life support content',
  },
  emt: {
    value: 'emt',
    label: 'EMT',
    level: 1,
    color: '#10b981', // green
    description: 'Emergency Medical Technician',
  },
  aemt: {
    value: 'aemt',
    label: 'AEMT',
    level: 2,
    color: '#3b82f6', // blue
    description: 'Advanced Emergency Medical Technician',
  },
  als: {
    value: 'als',
    label: 'ALS/Paramedic',
    level: 3,
    color: '#8b5cf6', // purple
    description: 'Advanced Life Support / Paramedic',
  },
  cct: {
    value: 'cct',
    label: 'CCT',
    level: 4,
    color: '#ef4444', // red
    description: 'Critical Care Transport',
  },
  physician: {
    value: 'physician',
    label: 'Physician Only',
    level: 5,
    color: '#f59e0b', // amber
    description: 'Physician-level interventions',
  },
} as const

export type CertLevelKey = keyof typeof CERT_LEVELS
export type CertLevel = (typeof CERT_LEVELS)[CertLevelKey]

/**
 * Determines if a user with a given certification level can view content
 * tagged with a specific certification level.
 *
 * @param userLevel - The user's certification level (0-5)
 * @param contentLevel - The content's required certification level (0-5)
 * @returns true if user can view the content
 *
 * @example
 * canViewContent(4, 3) // true - CCT can see ALS content
 * canViewContent(2, 4) // false - AEMT cannot see CCT content
 */
export function canViewContent(userLevel: number, contentLevel: number): boolean {
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
 * Filters content levels that a user can edit/create
 * Users can only tag content at or below their level
 */
export function getAvailableCertLevelsForUser(userLevel: number): CertLevel[] {
  return getAllCertLevels().filter((cert) => cert.level <= userLevel)
}
