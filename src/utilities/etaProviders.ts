/**
 * ETA Provider Abstraction Layer
 * Supports Google Maps and HERE API with configurable fallback
 */

import { calculateDistanceMiles } from './distance'

export type TrafficStatus = 'green' | 'yellow' | 'red'

export interface EtaResult {
  etaMinutes: number
  distanceMiles: number
  baseDurationSeconds: number
  trafficDurationSeconds: number
  trafficRatio: number
  trafficStatus: TrafficStatus
  provider: 'google' | 'here' | 'fallback'
}

export interface EtaProvider {
  name: string
  calculateEta(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number,
    withTraffic: boolean,
  ): Promise<EtaResult>
}

/**
 * Google Maps Distance Matrix API Provider
 */
export class GoogleMapsProvider implements EtaProvider {
  name = 'google'
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async calculateEta(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number,
    withTraffic: boolean,
  ): Promise<EtaResult> {
    const url = new URL('https://maps.googleapis.com/maps/api/distancematrix/json')
    url.searchParams.set('origins', `${originLat},${originLng}`)
    url.searchParams.set('destinations', `${destLat},${destLng}`)
    url.searchParams.set('key', this.apiKey)

    // Add traffic parameters if requested
    if (withTraffic) {
      url.searchParams.set('departure_time', 'now')
      url.searchParams.set('traffic_model', 'best_guess')
    }

    const response = await fetch(url.toString())
    const data = await response.json()

    if (data.status !== 'OK') {
      throw new Error(`Google Maps API error: ${data.status}`)
    }

    const element = data.rows?.[0]?.elements?.[0]
    if (!element || element.status !== 'OK') {
      throw new Error(`No route found: ${element?.status}`)
    }

    const baseDuration = element.duration?.value || 0
    const trafficDuration = element.duration_in_traffic?.value || baseDuration
    const distance = element.distance?.value || 0

    return this.buildEtaResult(baseDuration, trafficDuration, distance, 'google')
  }

  private buildEtaResult(
    baseDuration: number,
    trafficDuration: number,
    distanceMeters: number,
    provider: 'google' | 'here',
  ): EtaResult {
    const trafficRatio = baseDuration > 0 ? trafficDuration / baseDuration : 1.0

    let trafficStatus: TrafficStatus = 'green'
    if (trafficRatio > 1.35) {
      trafficStatus = 'red'
    } else if (trafficRatio > 1.15) {
      trafficStatus = 'yellow'
    }

    return {
      etaMinutes: Math.round(trafficDuration / 60),
      distanceMiles: Math.round((distanceMeters / 1609.34) * 10) / 10,
      baseDurationSeconds: baseDuration,
      trafficDurationSeconds: trafficDuration,
      trafficRatio: Math.round(trafficRatio * 100) / 100,
      trafficStatus,
      provider,
    }
  }
}

/**
 * HERE Routing API v8 Provider
 * Docs: https://developer.here.com/documentation/routing-api/dev_guide/index.html
 */
export class HereProvider implements EtaProvider {
  name = 'here'
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async calculateEta(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number,
    withTraffic: boolean,
  ): Promise<EtaResult> {
    // HERE Routing API v8 endpoint
    const url = new URL('https://router.hereapi.com/v8/routes')

    // Set origin and destination
    url.searchParams.set('origin', `${originLat},${originLng}`)
    url.searchParams.set('destination', `${destLat},${destLng}`)
    url.searchParams.set('transportMode', 'car')
    url.searchParams.set('return', 'summary')
    url.searchParams.set('apiKey', this.apiKey)

    // Traffic mode: 'enabled' for live traffic, 'disabled' for baseline
    if (withTraffic) {
      url.searchParams.set('departureTime', 'now')
      // 'enabled' uses real-time traffic
    } else {
      url.searchParams.set('departureTime', 'any')
    }

    console.log('[HERE API] Request URL:', url.toString().replace(this.apiKey, 'REDACTED'))

    const response = await fetch(url.toString())

    if (!response.ok) {
      const error = await response.json()
      console.error('[HERE API] Error response:', JSON.stringify(error, null, 2))
      throw new Error(`HERE API error: ${response.status} - ${error.title || error.detail || 'Unknown error'}`)
    }

    const data = await response.json()

    if (!data.routes || data.routes.length === 0) {
      throw new Error('No route found')
    }

    const route = data.routes[0]
    const summary = route.sections?.[0]?.summary

    if (!summary) {
      throw new Error('No route summary found')
    }

    // HERE returns duration in seconds and distance in meters
    const trafficDuration = summary.duration || 0
    const distance = summary.length || 0

    // Guard against obvious coordinate ordering issues by comparing to haversine distance
    const expectedDistanceMeters = calculateDistanceMiles(originLat, originLng, destLat, destLng) * 1609.34
    if (expectedDistanceMeters > 0) {
      const distanceRatio = distance / expectedDistanceMeters
      if (distanceRatio > 3 || distanceRatio < 0.3) {
        throw new Error(
          `HERE API returned unrealistic distance (ratio ${Math.round(distanceRatio * 100) / 100}). Check lat/lng ordering.`,
        )
      }
    }

    // For baseline duration, we need to make a second call without traffic
    // Or estimate it from the traffic duration
    let baseDuration = summary.baseDuration || trafficDuration

    // If we have traffic data, HERE provides baseDuration
    // Otherwise both are the same
    if (!withTraffic) {
      baseDuration = trafficDuration
    }

    return this.buildEtaResult(baseDuration, trafficDuration, distance, 'here')
  }

  private buildEtaResult(
    baseDuration: number,
    trafficDuration: number,
    distanceMeters: number,
    provider: 'google' | 'here',
  ): EtaResult {
    const trafficRatio = baseDuration > 0 ? trafficDuration / baseDuration : 1.0

    let trafficStatus: TrafficStatus = 'green'
    if (trafficRatio > 1.35) {
      trafficStatus = 'red'
    } else if (trafficRatio > 1.15) {
      trafficStatus = 'yellow'
    }

    return {
      etaMinutes: Math.round(trafficDuration / 60),
      distanceMiles: Math.round((distanceMeters / 1609.34) * 10) / 10,
      baseDurationSeconds: baseDuration,
      trafficDurationSeconds: trafficDuration,
      trafficRatio: Math.round(trafficRatio * 100) / 100,
      trafficStatus,
      provider,
    }
  }
}

/**
 * Get ETA provider based on configuration
 * Supports fallback from primary to secondary provider
 */
export async function getEtaWithFallback(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
  withTraffic: boolean,
): Promise<EtaResult> {
  const primaryProvider = process.env.ETA_PROVIDER || 'google'
  const fallbackEnabled = process.env.ETA_FALLBACK_ENABLED !== 'false'

  const providers: EtaProvider[] = []

  // Build provider list based on configuration
  if (primaryProvider === 'google' && process.env.GOOGLE_MAPS_API_KEY) {
    providers.push(new GoogleMapsProvider(process.env.GOOGLE_MAPS_API_KEY))
  } else if (primaryProvider === 'here' && process.env.HERE_API_KEY) {
    providers.push(new HereProvider(process.env.HERE_API_KEY))
  }

  // Add fallback provider if enabled
  if (fallbackEnabled) {
    if (primaryProvider === 'google' && process.env.HERE_API_KEY) {
      providers.push(new HereProvider(process.env.HERE_API_KEY))
    } else if (primaryProvider === 'here' && process.env.GOOGLE_MAPS_API_KEY) {
      providers.push(new GoogleMapsProvider(process.env.GOOGLE_MAPS_API_KEY))
    }
  }

  // Try each provider in order
  let lastError: Error | null = null

  for (const provider of providers) {
    try {
      console.log(`Trying ETA provider: ${provider.name}`)
      const result = await provider.calculateEta(originLat, originLng, destLat, destLng, withTraffic)
      console.log(`Successfully got ETA from ${provider.name}`)
      return result
    } catch (error) {
      console.warn(`${provider.name} provider failed:`, error instanceof Error ? error.message : error)
      lastError = error instanceof Error ? error : new Error(String(error))
      // Continue to next provider
    }
  }

  // If all providers failed, throw the last error
  throw lastError || new Error('No ETA providers available')
}
