import type { Metadata } from 'next'
import { getServerSideURL } from './getURL'

type OpenGraphDefaults = {
  description?: string | null
  image?: string | null
  siteName?: string | null
  title?: string | null
  type?: 'article' | 'book' | 'website' | 'profile' | 'music.song' | 'music.album' | 'music.playlist' | 'music.radio_station' | 'video.movie' | 'video.episode' | 'video.tv_show' | 'video.other'
}

const getDefaultOpenGraph = (defaults?: OpenGraphDefaults): NonNullable<Metadata['openGraph']> => {
  const fallbackImage = defaults?.image || `${getServerSideURL()}/website-template-OG.webp`

  return {
    type: defaults?.type || 'website',
    description: defaults?.description || 'Offline-ready access to protocols, checklists, and calculators.',
    images: [
      {
        url: fallbackImage,
      },
    ],
    siteName: defaults?.siteName || 'AirCare Protocol Hub',
    title: defaults?.title || 'AirCare Protocol Hub',
  }
}

export const mergeOpenGraph = (
  og?: Metadata['openGraph'],
  defaults?: OpenGraphDefaults,
): Metadata['openGraph'] => {
  const base = getDefaultOpenGraph(defaults)

  return {
    ...base,
    ...og,
    images: og?.images ? og.images : base.images,
  }
}
