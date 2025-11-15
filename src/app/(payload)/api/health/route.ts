import { NextResponse } from 'next/server'

/**
 * Health check endpoint for monitoring and Docker health checks
 * Returns 200 OK if the application is running
 */
export async function GET() {
  return NextResponse.json(
    { 
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'ucair-care'
    },
    { status: 200 }
  )
}
