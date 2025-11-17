import { NextRequest, NextResponse } from 'next/server'

// UCMC coordinates (fallback origin)
const UCMC_COORDS = {
  lat: 39.1371,
  lng: -84.5037,
}

interface DistanceMatrixElement {
  distance?: {
    value: number
    text: string
  }
  duration?: {
    value: number
    text: string
  }
  duration_in_traffic?: {
    value: number
    text: string
  }
  status: string
}

interface DistanceMatrixResponse {
  rows?: Array<{
    elements?: DistanceMatrixElement[]
  }>
  status: string
  error_message?: string
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const originLat = searchParams.get('originLat')
    const originLng = searchParams.get('originLng')
    const destLat = searchParams.get('destLat')
    const destLng = searchParams.get('destLng')
    const fallbackOrigin = searchParams.get('fallbackOrigin')

    // Validate required parameters
    if (!destLat || !destLng) {
      return NextResponse.json(
        { error: 'Missing required parameters: destLat, destLng' },
        { status: 400 },
      )
    }

    // Validate API key
    const apiKey = process.env.GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      console.error('GOOGLE_MAPS_API_KEY not configured')
      return NextResponse.json(
        { error: 'Google Maps API key not configured' },
        { status: 500 },
      )
    }

    // Determine origin coordinates
    let origin: string
    let isLiveTraffic = false

    if (fallbackOrigin === 'ucmc') {
      // Use UCMC as origin (no live traffic)
      origin = `${UCMC_COORDS.lat},${UCMC_COORDS.lng}`
      isLiveTraffic = false
    } else if (originLat && originLng) {
      // Use provided GPS coordinates (with live traffic)
      origin = `${originLat},${originLng}`
      isLiveTraffic = true
    } else {
      return NextResponse.json(
        { error: 'Must provide either originLat/originLng or fallbackOrigin=ucmc' },
        { status: 400 },
      )
    }

    // Build Google Distance Matrix API URL
    const url = new URL('https://maps.googleapis.com/maps/api/distancematrix/json')
    url.searchParams.set('origins', origin)
    url.searchParams.set('destinations', `${destLat},${destLng}`)
    url.searchParams.set('key', apiKey)

    // Add traffic parameters only for live traffic
    if (isLiveTraffic) {
      url.searchParams.set('departure_time', 'now')
      url.searchParams.set('traffic_model', 'best_guess')
    }

    // Call Google Maps API
    const response = await fetch(url.toString())
    const data: DistanceMatrixResponse = await response.json()

    // Check for API errors
    if (data.status !== 'OK') {
      console.error('Google Maps API error:', data.status, data.error_message)
      return NextResponse.json(
        { error: `Google Maps API error: ${data.status}` },
        { status: 500 },
      )
    }

    // Extract the result
    const element = data.rows?.[0]?.elements?.[0]

    if (!element || element.status !== 'OK') {
      console.error('No route found:', element?.status)
      return NextResponse.json({ error: 'No route found' }, { status: 404 })
    }

    // Calculate ETA and traffic ratio
    const baseDuration = element.duration?.value || 0
    const trafficDuration = element.duration_in_traffic?.value || baseDuration
    const distance = element.distance?.value || 0

    // Calculate traffic ratio
    const trafficRatio = baseDuration > 0 ? trafficDuration / baseDuration : 1.0

    // Determine traffic status based on ratio
    let trafficStatus: 'green' | 'yellow' | 'red' = 'green'
    if (trafficRatio > 1.35) {
      trafficStatus = 'red'
    } else if (trafficRatio > 1.15) {
      trafficStatus = 'yellow'
    }

    // Build response
    const etaResponse = {
      etaMinutes: Math.round(trafficDuration / 60),
      distanceMiles: Math.round((distance / 1609.34) * 10) / 10, // meters to miles, 1 decimal
      baseDurationSeconds: baseDuration,
      trafficDurationSeconds: trafficDuration,
      trafficRatio: Math.round(trafficRatio * 100) / 100, // 2 decimal places
      trafficStatus,
      source: isLiveTraffic ? 'device_live_traffic' : 'ucmc_baseline',
      lastUpdated: new Date().toISOString(),
    }

    return NextResponse.json(etaResponse)
  } catch (error) {
    console.error('ETA API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
