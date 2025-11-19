import type { Metadata } from 'next/types'

import { CollectionArchive } from '@/components/CollectionArchive'
import { PageRange } from '@/components/PageRange'
import { Pagination } from '@/components/Pagination'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'
import PageClient from './page.client'
import { getSiteMetadataDefaults } from '@/utilities/generateMeta'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'

export const dynamic = 'force-static'
export const revalidate = 600

export default async function Page() {
  const payload = await getPayload({ config: configPromise })

  const posts = await payload.find({
    collection: 'posts',
    depth: 1,
    limit: 12,
    overrideAccess: false,
    select: {
      title: true,
      slug: true,
      categories: true,
      meta: true,
    },
  })

  return (
    <div className="pt-24 pb-24">
      <PageClient />
      <div className="container mb-16">
        <div className="prose dark:prose-invert max-w-none">
          <h1>Posts</h1>
        </div>
      </div>

      <div className="container mb-8">
        <PageRange
          collection="posts"
          currentPage={posts.page}
          limit={12}
          totalDocs={posts.totalDocs}
        />
      </div>

      <CollectionArchive posts={posts.docs} />

      <div className="container">
        {posts.totalPages > 1 && posts.page && (
          <Pagination page={posts.page} totalPages={posts.totalPages} />
        )}
      </div>
    </div>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  const siteDefaults = await getSiteMetadataDefaults()
  const title = `${siteDefaults.siteName} Posts`

  return {
    description: siteDefaults.description,
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
        title,
      },
      {
        description: siteDefaults.description,
        image: siteDefaults.image,
        siteName: siteDefaults.siteName,
        title,
      },
    ),
    title,
    twitter: {
      card: 'summary_large_image',
      ...(siteDefaults.twitterHandle ? { creator: siteDefaults.twitterHandle } : {}),
    },
  }
}
