// storage-adapter-import-placeholder
import { s3Storage } from '@payloadcms/storage-s3'
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
import { ProtocolDefaults } from './globals/ProtocolDefaults'

import { Protocols } from './collections/Protocols'
import { Medications } from './collections/Medications'
import { MedicationClasses } from './collections/MedicationClasses'
import { HospitalNetworks } from './collections/HospitalNetworks'
import { HospitalCapabilities } from './collections/HospitalCapabilities'
import { Hospitals } from './collections/Hospitals'
import { HospitalChangeRequests } from './collections/HospitalChangeRequests'
import { BaseChangeRequests } from './collections/BaseChangeRequests'
import { Bases } from './collections/Bases'
import { Assets } from './collections/Assets'
import { Calculators } from './collections/Calculators'
import { Notifications } from './collections/Notifications'
import { AuditLog } from './collections/AuditLog'
import NotificationSettings from './collections/NotificationSettings'
import PushNotifications from './collections/PushNotifications'

import { plugins } from './plugins'
import { defaultLexical } from '@/fields/defaultLexical'
import { getServerSideURL } from './utilities/getURL'
import { resendAdapter } from '@payloadcms/email-resend'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const payloadSecret = process.env.PAYLOAD_SECRET

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
    // Navigation grouping is configured using admin.group on individual collections/globals.
    // Admin plugin collections (redirects, forms, form-submissions, search) are grouped
    // under "Administration" via their plugin configurations in src/plugins/index.ts
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
  email: resendAdapter({
    defaultFromAddress: process.env.FROM_EMAIL || 'noreply@ping.acmc.app',
    defaultFromName: process.env.FROM_NAME || 'Air Care & Mobile Care',
    apiKey: process.env.RESEND_API_KEY || '',
  }),

    collections: [
    Pages,
    Posts,
    Media,
    Categories,
    Users,
    Protocols,
    Medications,
      MedicationClasses,
    HospitalNetworks,
    HospitalCapabilities,
    Hospitals,
    HospitalChangeRequests,
    BaseChangeRequests,
    Bases,
    Assets,
    Calculators,
    Notifications,
    AuditLog,
    NotificationSettings,
    PushNotifications,
  ],

  cors: [getServerSideURL()].filter(Boolean),
  globals: [Header, Footer, SiteSettings, ProtocolDefaults],
  plugins: [
    ...plugins,
    // storage-adapter-placeholder
    s3Storage({
      collections: {
        media: {
          disableLocalStorage: true,
          generateFileURL: ({ filename, prefix = '' }) => {
            return `https://${process.env.S3_BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com/${prefix}${filename}`
          },
        },
      },
      bucket: process.env.S3_BUCKET || '',
      config: {
        region: process.env.S3_REGION || '',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        },
      },
    }),
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
