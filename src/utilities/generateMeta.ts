import type { Metadata } from 'next'

import type { Media, Page, Post, Config, SiteSetting } from '../payload-types'

import { mergeOpenGraph } from './mergeOpenGraph'
import { getServerSideURL } from './getURL'
import { getCachedGlobal } from './getGlobals'

const getSiteSettings = getCachedGlobal('site-settings', 2)

const getImageURL = (
  image?: Media | Config['db']['defaultIDType'] | null,
  fallbackImage?: Media | Config['db']['defaultIDType'] | null,
) => {
  const serverUrl = getServerSideURL()
  const source = image || fallbackImage

  let url = serverUrl + '/website-template-OG.webp'

  if (source && typeof source === 'object' && 'url' in source) {
    const ogUrl = source.sizes?.og?.url

    url = ogUrl ? serverUrl + ogUrl : serverUrl + source.url
  }

  return url
}

export const getSiteMetadataDefaults = async () => {
  const siteSettings = (await getSiteSettings()) as SiteSetting

  const siteName = siteSettings?.metaSiteName || siteSettings?.siteName || 'AirCare Protocol Hub'
  const title = siteSettings?.metaTitle || siteName
  const description =
    siteSettings?.metaDescription || 'Offline-ready access to protocols, checklists, and calculators.'
  const image = getImageURL(siteSettings?.metaImage)

  return {
    description,
    image,
    siteName,
    title,
    twitterHandle: siteSettings?.metaTwitterHandle,
  }
}

export const generateMeta = async (args: {
  doc: Partial<Page> | Partial<Post> | null
}): Promise<Metadata> => {
  const { doc } = args

  const siteDefaults = await getSiteMetadataDefaults()

  const ogImage = getImageURL(doc?.meta?.image, siteDefaults.image)

  const title = doc?.meta?.title
    ? `${doc.meta.title} | ${siteDefaults.siteName}`
    : siteDefaults.title

  const description = doc?.meta?.description || siteDefaults.description

  const openGraph = mergeOpenGraph(
    {
      description,
      images: ogImage
        ? [
            {
              url: ogImage,
            },
          ]
        : undefined,
      siteName: siteDefaults.siteName,
      title,
      url: Array.isArray(doc?.slug) ? doc?.slug.join('/') : '/',
    },
    {
      description: siteDefaults.description,
      image: siteDefaults.image,
      siteName: siteDefaults.siteName,
      title: siteDefaults.title,
    },
  )

  return {
    description,
    openGraph,
    title,
    twitter: siteDefaults.twitterHandle
      ? {
          card: 'summary_large_image',
          creator: siteDefaults.twitterHandle,
        }
      : undefined,
  }
}
