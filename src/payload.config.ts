// storage-adapter-import-placeholder
import { postgresAdapter } from '@payloadcms/db-postgres'

import sharp from 'sharp' // sharp-import
import path from 'path'
import { buildConfig, PayloadRequest } from 'payload'
import { fileURLToPath } from 'url'

import { Categories } from './collections/Categories'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
import { Users } from './collections/Users'
import { Footer } from './Footer/config'
import { Header } from './Header/config'
import { SiteSettings } from './globals/SiteSettings/config'

import { Protocols } from './collections/Protocols'
import { HospitalNetworks } from './collections/HospitalNetworks'
import { HospitalCapabilities } from './collections/HospitalCapabilities'
import { Hospitals } from './collections/Hospitals'
import { HospitalChangeRequests } from './collections/HospitalChangeRequests'
import { Bases } from './collections/Bases'
import { Assets } from './collections/Assets'
import { Calculators } from './collections/Calculators'

import { plugins } from './plugins'
import { defaultLexical } from '@/fields/defaultLexical'
import { getServerSideURL } from './utilities/getURL'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const payloadSecret = process.env.PAYLOAD_SECRET
const ADMIN_COLLECTION_SLUGS = ['redirects', 'forms', 'form-submissions', 'search'] as const

if (!payloadSecret && process.env.NODE_ENV === 'production') {
  throw new Error('PAYLOAD_SECRET must be defined in production environments.')
}

export default buildConfig({
  admin: {
    components: {
      // The `BeforeLogin` component renders a message that you see while logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below.
      beforeLogin: ['@/components/BeforeLogin'],
      // The `BeforeDashboard` component renders the 'welcome' block that you see after logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below.
      beforeDashboard: ['@/components/BeforeDashboard'],
    },
    // TODO: In Payload v3, the `navigation` property has been removed from admin config.
    // To customize navigation, we need to create a custom Nav component and use admin.components.Nav
    // See: https://payloadcms.com/docs/custom-components/root-components
    // Previous functionality: Grouped admin collections (redirects, forms, etc.) under "Administration" label
    // navigation: ({ defaultNav }) => {
    //   const adminCollections = new Set<string>()
    //
    //   const navWithoutAdminCollections = defaultNav
    //     .map((group) => {
    //       if (!group.collections || group.collections.length === 0) return group
    //
    //       const remainingCollections = group.collections.filter((collection) => {
    //         const slug = typeof collection === 'string' ? collection : collection.slug
    //         if (ADMIN_COLLECTION_SLUGS.includes(slug as (typeof ADMIN_COLLECTION_SLUGS)[number])) {
    //           adminCollections.add(slug)
    //           return false
    //         }
    //         return true
    //       })
    //
    //       if (remainingCollections.length === group.collections.length) {
    //         return group
    //       }
    //
    //       if (remainingCollections.length === 0 && !(group.items && group.items.length > 0)) {
    //         return null
    //       }
    //
    //       return {
    //         ...group,
    //         collections: remainingCollections,
    //       }
    //     })
    //     .filter((group): group is NonNullable<typeof group> => Boolean(group))
    //
    //   const adminGroupCollections = ADMIN_COLLECTION_SLUGS.filter((slug) => adminCollections.has(slug))
    //
    //   if (!adminGroupCollections.length) {
    //     return defaultNav
    //   }
    //
    //   return [
    //     ...navWithoutAdminCollections,
    //     {
    //       label: 'Administration',
    //       collections: adminGroupCollections,
    //     },
    //   ]
    // },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    user: Users.slug,
    livePreview: {
      breakpoints: [
        {
          label: 'Mobile',
          name: 'mobile',
          width: 375,
          height: 667,
        },
        {
          label: 'Tablet',
          name: 'tablet',
          width: 768,
          height: 1024,
        },
        {
          label: 'Desktop',
          name: 'desktop',
          width: 1440,
          height: 900,
        },
      ],
    },
  },
  // This config helps us configure global or default features that the other editors can inherit
  editor: defaultLexical,
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
    migrationDir: path.resolve(dirname, 'migrations'),
  }),

  collections: [
    Pages,
    Posts,
    Media,
    Categories,
    Users,
    Protocols,
    HospitalNetworks,
    HospitalCapabilities,
    Hospitals,
    HospitalChangeRequests,
    Bases,
    Assets,
    Calculators,
  ],

  cors: [getServerSideURL()].filter(Boolean),
  globals: [Header, Footer, SiteSettings],
  plugins: [
    ...plugins,
    // storage-adapter-placeholder
    ],
    secret: payloadSecret || 'development-secret',
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  jobs: {
    access: {
      run: ({ req }: { req: PayloadRequest }): boolean => {
        // Allow logged in users to execute this endpoint (default)
        if (req.user) return true

        // If there is no logged in user, then check
        // for the Vercel Cron secret to be present as an
        // Authorization header:
        const authHeader = req.headers.get('authorization')
        return authHeader === `Bearer ${process.env.CRON_SECRET}`
      },
    },
    tasks: [],
  },
})
