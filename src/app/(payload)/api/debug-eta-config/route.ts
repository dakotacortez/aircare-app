import { NextResponse } from 'next/server'

/**
 * Debug endpoint to check ETA provider configuration
 * Access: https://acmc.app/api/debug-eta-config
 */
export async function GET() {
  return NextResponse.json({
    ETA_PROVIDER: process.env.ETA_PROVIDER ?? null,
    ETA_FALLBACK_ENABLED: process.env.ETA_FALLBACK_ENABLED ?? null,
    GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY ? 'SET (length: ' + process.env.GOOGLE_MAPS_API_KEY.length + ')' : null,
    HERE_API_KEY: process.env.HERE_API_KEY ? 'SET (length: ' + process.env.HERE_API_KEY.length + ')' : null,
  })
}
