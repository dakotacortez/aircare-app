import { NextRequest, NextResponse } from 'next/server'
import { getEtaWithFallback } from '@/utilities/etaProviders'

// UCMC coordinates (fallback origin)
const UCMC_COORDS = {
  lat: 39.1371,
  lng: -84.5037,
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

    // Validate that at least one API key is configured
    const hasGoogleKey = !!process.env.GOOGLE_MAPS_API_KEY
    const hasHereKey = !!process.env.HERE_API_KEY

    if (!hasGoogleKey && !hasHereKey) {
      console.error('No ETA provider API keys configured')
      return NextResponse.json(
        { error: 'No ETA provider API keys configured. Set GOOGLE_MAPS_API_KEY or HERE_API_KEY' },
        { status: 500 },
      )
    }

    // Determine origin coordinates
    let origin: { lat: number; lng: number }
    let isLiveTraffic = false

    if (fallbackOrigin === 'ucmc') {
      // Use UCMC as origin (no live traffic)
      origin = UCMC_COORDS
      isLiveTraffic = false
    } else if (originLat && originLng) {
      // Use provided GPS coordinates (with live traffic)
      origin = {
        lat: parseFloat(originLat),
        lng: parseFloat(originLng),
      }
      isLiveTraffic = true
    } else {
      return NextResponse.json(
        { error: 'Must provide either originLat/originLng or fallbackOrigin=ucmc' },
        { status: 400 },
      )
    }

    // Get ETA using configured provider with fallback
    const result = await getEtaWithFallback(
      origin.lat,
      origin.lng,
      parseFloat(destLat),
      parseFloat(destLng),
      isLiveTraffic,
    )

    // Build response
    const etaResponse = {
      etaMinutes: result.etaMinutes,
      distanceMiles: result.distanceMiles,
      baseDurationSeconds: result.baseDurationSeconds,
      trafficDurationSeconds: result.trafficDurationSeconds,
      trafficRatio: result.trafficRatio,
      trafficStatus: result.trafficStatus,
      source: isLiveTraffic ? 'device_live_traffic' : 'ucmc_baseline',
      provider: result.provider,
      lastUpdated: new Date().toISOString(),
    }

    return NextResponse.json(etaResponse)
  } catch (error) {
    console.error('ETA API error:', error)
    return NextResponse.json(
      { error: 'Failed to calculate ETA', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
