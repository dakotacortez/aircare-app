import type { Metadata } from 'next'

import { cn } from '@/utilities/ui'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import React from 'react'

import { AdminBar } from '@/components/AdminBar'
import { Footer } from '@/Footer/Component'
import { Header } from '@/Header/Component'
import { ReferenceCardDrawer } from '@/components/ReferenceCard'
import { Providers } from '@/providers'
import { InitTheme } from '@/providers/Theme/InitTheme'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { draftMode } from 'next/headers'
import { getSiteMetadataDefaults } from '@/utilities/generateMeta'

import './globals.css'
import { getServerSideURL } from '@/utilities/getURL'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { isEnabled } = await draftMode()

  return (
    <html className={cn(GeistSans.variable, GeistMono.variable)} lang="en" suppressHydrationWarning>
      <head>
        <InitTheme />
        <link href="/favicon.ico" rel="icon" sizes="32x32" />
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
      </head>
      <body>
        <Providers>
          <AdminBar
            adminBarProps={{
              preview: isEnabled,
            }}
          />

          <Header />
          {children}
          <Footer />
          <ReferenceCardDrawer />
        </Providers>
      </body>
    </html>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  const siteDefaults = await getSiteMetadataDefaults()

  return {
    description: siteDefaults.description,
    metadataBase: new URL(getServerSideURL()),
    openGraph: mergeOpenGraph(
      {
        description: siteDefaults.description,
        images: siteDefaults.image
          ? [
              {
                url: siteDefaults.image,
              },
            ]
          : undefined,
        siteName: siteDefaults.siteName,
        title: siteDefaults.title,
      },
      {
        description: siteDefaults.description,
        image: siteDefaults.image,
        siteName: siteDefaults.siteName,
        title: siteDefaults.title,
      },
    ),
    title: siteDefaults.title,
    twitter: {
      card: 'summary_large_image',
      ...(siteDefaults.twitterHandle ? { creator: siteDefaults.twitterHandle } : {}),
    },
  }
}
