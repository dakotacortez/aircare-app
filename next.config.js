import { withPayload } from '@payloadcms/next/withPayload'
import redirects from './redirects.js'

const NEXT_PUBLIC_SERVER_URL = 
  process.env.NEXT_PUBLIC_SERVER_URL || 
  (process.env.VERCEL_PROJECT_PRODUCTION_URL 
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` 
    : process.env.__NEXT_PRIVATE_ORIGIN || 'http://localhost:3000')

console.log('🖼️  IMAGE CONFIG USING URL:', NEXT_PUBLIC_SERVER_URL)

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      ...[NEXT_PUBLIC_SERVER_URL /* 'https://example.com' */].map((item) => {
        const url = new URL(item)
        return {
          hostname: url.hostname,
          protocol: url.protocol.replace(':', ''),
        }
      }),
    ],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }
    return webpackConfig
  },
  reactStrictMode: true,
  redirects,
}

const payloadConfig = withPayload(nextConfig, { devBundleServerPackages: false })

// Add empty turbopack config to satisfy Next.js 16 requirement
if (!('turbopack' in payloadConfig)) {
  payloadConfig.turbopack = {}
}

payloadConfig.experimental = {
  ...(payloadConfig.experimental ?? {}),
  allowedDevOrigins: ['https://ucair.care'],
}

export default payloadConfig
