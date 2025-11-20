/**
 * Haversine formula to calculate the distance between two coordinates in miles.
 */
export function calculateDistanceMiles(
  originLat: number,
  originLon: number,
  destLat: number,
  destLon: number,
): number {
  const R = 3959 // Earth's radius in miles
  const toRad = (value: number) => (value * Math.PI) / 180
  const dLat = toRad(destLat - originLat)
  const dLon = toRad(destLon - originLon)
  const lat1 = toRad(originLat)
  const lat2 = toRad(destLat)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

/**
 * Estimate travel time in minutes using a tiered average speed model.
 * This is used as a fallback when Google Maps API is not available.
 */
export function estimateEtaMinutes(distanceInMiles: number): number {
  let averageSpeed: number

  if (distanceInMiles < 5) {
    averageSpeed = 35
  } else if (distanceInMiles < 15) {
    averageSpeed = 45
  } else {
    averageSpeed = 55
  }

  return Math.round((distanceInMiles / averageSpeed) * 60)
}

/**
 * Traffic status based on the ratio of traffic duration to base duration.
 */
export type TrafficStatus = 'green' | 'yellow' | 'red'

/**
 * Response from the ETA API endpoint.
 */
export interface EtaResponse {
  etaMinutes: number
  distanceMiles: number
  baseDurationSeconds: number
  trafficDurationSeconds: number
  trafficRatio: number
  trafficStatus: TrafficStatus
  source: 'device_live_traffic' | 'ucmc_baseline'
  provider?: 'google' | 'here' | 'fallback'
  lastUpdated: string
}

/**
 * Fetch real-time ETA using configured provider (Google Maps or HERE API).
 * Automatically falls back to alternate provider if primary fails.
 * Falls back to UCMC origin if no GPS coordinates provided.
 *
 * @param destLat Destination latitude
 * @param destLng Destination longitude
 * @param originLat Optional origin latitude (from GPS)
 * @param originLng Optional origin longitude (from GPS)
 * @returns ETA response with traffic information, or null if API fails
 */
export async function fetchRealTimeEta(
  destLat: number,
  destLng: number,
  originLat?: number,
  originLng?: number,
): Promise<EtaResponse | null> {
  try {
    const params = new URLSearchParams({
      destLat: destLat.toString(),
      destLng: destLng.toString(),
    })

    // Add origin coordinates if available, otherwise use UCMC fallback
    if (originLat !== undefined && originLng !== undefined) {
      params.set('originLat', originLat.toString())
      params.set('originLng', originLng.toString())
    } else {
      params.set('fallbackOrigin', 'ucmc')
    }

    const response = await fetch(`/api/eta?${params.toString()}`)

    if (!response.ok) {
      const error = await response.json()
      console.error('ETA API error:', error)
      return null
    }

    const data: EtaResponse = await response.json()
    return data
  } catch (error) {
    console.error('Failed to fetch real-time ETA:', error)
    return null
  }
}

/**
 * Get traffic status color for UI rendering.
 */
export function getTrafficColor(status: TrafficStatus): string {
  switch (status) {
    case 'green':
      return 'text-green-600 dark:text-green-400'
    case 'yellow':
      return 'text-yellow-600 dark:text-yellow-400'
    case 'red':
      return 'text-red-600 dark:text-red-400'
  }
}

/**
 * Get traffic status description for display.
 */
export function getTrafficDescription(status: TrafficStatus, source: string): string {
  if (source === 'ucmc_baseline') {
    return 'Estimated from UCMC'
  }

  switch (status) {
    case 'green':
      return 'Normal traffic'
    case 'yellow':
      return 'Moderate traffic'
    case 'red':
      return 'Heavy traffic'
  }
}
