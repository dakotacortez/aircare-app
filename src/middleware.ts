import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Block common bot/scanner patterns
  const blockedPatterns = [
    /\.php$/i,                    // Any PHP files
    /\/wp-/i,                     // WordPress paths
    /index\.php/i,                // index.php with query params
    /\/forums?\//i,               // Forum paths
    /\/calendar\//i,              // Calendar paths
    /\/administrator\//i,         // Admin panels
    /\/xmlrpc\.php/i,            // XML-RPC
    /\/\.env$/i,                 // Environment files
    /\/\.git/i,                  // Git files
  ]

  // Check if pathname matches any blocked pattern
  if (blockedPatterns.some(pattern => pattern.test(pathname))) {
    // Return 404 immediately without processing
    return new NextResponse(null, { status: 404 })
  }

  // Allow valid requests to continue
  return NextResponse.next()
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
