import type { CollectionConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import {
  BoldFeature,
  ItalicFeature,
  UnderlineFeature,
  StrikethroughFeature,
  InlineCodeFeature,
  SuperscriptFeature,
  SubscriptFeature,
  HeadingFeature,
  OrderedListFeature,
  UnorderedListFeature,
  ChecklistFeature,
  LinkFeature,
  ParagraphFeature,
  BlockquoteFeature,
  HorizontalRuleFeature,
  AlignFeature,
  IndentFeature,
  UploadFeature,
  FixedToolbarFeature,
  InlineToolbarFeature,
} from '@payloadcms/richtext-lexical'
import { CertificationLevelFeature } from '../lexical/features/certificationLevel'
import { CalloutBlockFeature } from '../lexical/features/calloutBlock'
import { isContentTeamOrAdmin } from '../access/isContentTeamOrAdmin'
import { isAdmin } from '../access/isAdmin'

/**
 * Shared Lexical Editor Features
 * Base feature set for all protocol rich text fields
 */
const getBaseFeatures = () => [
  FixedToolbarFeature(),
  InlineToolbarFeature(),
  ParagraphFeature(),
  BoldFeature(),
  ItalicFeature(),
  UnderlineFeature(),
  StrikethroughFeature(),
  InlineCodeFeature(),
  SuperscriptFeature(),
  SubscriptFeature(),
  AlignFeature(),
  IndentFeature(),
  OrderedListFeature(),
  UnorderedListFeature(),
  ChecklistFeature(),
  BlockquoteFeature(),
  CalloutBlockFeature(),
  CertificationLevelFeature(),
]

/**
 * Full protocol editor (with headings, links, and horizontal rules)
 */
const getFullProtocolEditor = () => lexicalEditor({
  features: [
    ...getBaseFeatures(),
    HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
    HorizontalRuleFeature(),
    LinkFeature({ enabledCollections: ['protocols'] }),
  ],
})

/**
 * Simple protocol editor (no horizontal rules, limited headings)
 */
const getSimpleProtocolEditor = () => lexicalEditor({
  features: [
    ...getBaseFeatures(),
    HeadingFeature({ enabledHeadingSizes: ['h3', 'h4'] }),
  ],
})

/**
 * References editor (includes upload for images/diagrams)
 */
const getReferencesEditor = () => lexicalEditor({
  features: [
    ...getBaseFeatures(),
    HorizontalRuleFeature(),
    LinkFeature({ enabledCollections: ['protocols'] }),
    UploadFeature({
      collections: {
        media: {
          fields: [
            {
              name: 'caption',
              type: 'text',
            },
          ],
        },
      },
    }),
  ],
})

/**
 * Protocols Collection
 * Fresh collection with orderable enabled from the start
 * Uses built-in _status (draft/published) instead of custom status enum
 */
export const Protocols: CollectionConfig = {
  slug: 'protocols',
  labels: {
    singular: 'Protocol',
    plural: 'Protocols',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'protocolNumber', 'category', 'subcategory', 'effectiveDate'],
    group: 'Clinical Content',
    listSearchableFields: ['title', 'protocolNumber', 'keywords'],
    description: 'Clinical protocols with inline certification level tagging',
  },
  // Enable orderable from DAY ONE (before any data exists)
  orderable: true,
  access: {
    // Read access:
    // - Unauthenticated (guest): No access - must login
    // - Pending users (not approved): No access - awaiting approval
    // - Approved users: Can only see published protocols
    // - Content Team/Admin: Can see all protocols (for editing in admin panel)
    read: ({ req: { user } }) => {
      // No user = no access
      if (!user) return false

      // User must be active
      if (user.status !== 'active') return false

      // Content Team and Admin can see everything (for editing in admin panel)
      if (user.role === 'content-team' || user.role === 'admin-team') {
        return true
      }

      // Regular users must be approved AND can only see published protocols
      if (user.role === 'user' && user.approved) {
        return {
          _status: {
            equals: 'published',
          },
        }
      }

      // Not approved or inactive = no access
      return false
    },
    // Create: Content Team and Admin only
    create: isContentTeamOrAdmin,
    // Update: Content Team and Admin only
    update: isContentTeamOrAdmin,
    // Delete: Admin only
    delete: isAdmin,
  },
  // Use built-in drafts system with autosave
  versions: {
    drafts: {
      autosave: {
        interval: 120000, // Autosave every 2 minutes
      },
    },
    maxPerDoc: 25,
  },
  fields: [
    // Basic Protocol Info
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Protocol Name',
      admin: {
        placeholder: 'e.g., Acute Coronary Syndrome (ACS)',
      },
    },
    {
      name: 'protocolNumber',
      type: 'text',
      required: true,
      unique: true,
      label: 'Protocol Number',
      admin: {
        placeholder: 'e.g., MED-CARD-001',
      },
      // Validate that it's URL-safe
      validate: (value: string | null | undefined) => {
        if (!value) return 'Protocol number is required'
        // Allow letters, numbers, hyphens, underscores
        if (!/^[A-Za-z0-9_-]+$/.test(value)) {
          return 'Protocol number can only contain letters, numbers, hyphens, and underscores'
        }
        return true
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'category',
          type: 'select',
          required: true,
          options: [
            { label: 'Medical', value: 'medical' },
            { label: 'Trauma', value: 'trauma' },
            { label: 'Pediatric', value: 'pediatric' },
            { label: 'Neonatal', value: 'neonatal' },
            { label: 'OB/GYN', value: 'obgyn' },
            { label: 'Procedures', value: 'procedures' },
            { label: 'Behavioral', value: 'behavioral' },
            { label: 'Environmental', value: 'environmental' },
            { label: 'Special Operations', value: 'special-ops' },
          ],
        },
        {
          name: 'subcategory',
          type: 'text',
          required: true,
          label: 'Subcategory',
          admin: {
            placeholder: 'e.g., Cardiovascular, Airway Management',
          },
        },
      ],
    },

    // Universal Content (shown to all service lines)
    {
      name: 'contentUniversal',
      type: 'richText',
      label: 'Protocol (Universal)',
      admin: {
        description: 'Intro and universal guidelines for all service lines',
      },
      editor: getFullProtocolEditor(),
    },

    // BLS-Specific Content
    {
      name: 'contentBLS',
      type: 'richText',
      label: 'Protocol (BLS)',
      admin: {
        description: 'BLS-specific procedures and protocols',
      },
      editor: getFullProtocolEditor(),
    },

    // ALS-Specific Content
    {
      name: 'contentALS',
      type: 'richText',
      label: 'Protocol (ALS)',
      admin: {
        description: 'ALS-specific procedures and protocols',
      },
      editor: getFullProtocolEditor(),
    },

    // CCT-Specific Content
    {
      name: 'contentCCT',
      type: 'richText',
      label: 'Protocol (CCT)',
      admin: {
        description: 'CCT-specific procedures and protocols',
      },
      editor: getFullProtocolEditor(),
    },

    // Special Considerations (shared across all levels)
    {
      name: 'specialConsiderations',
      type: 'richText',
      label: 'Special Considerations',
      admin: {
        description: 'Level-specific callouts and uncommon adjustments',
      },
      editor: getSimpleProtocolEditor(),
    },

    // Key Points / Pearls
    {
      name: 'keyPoints',
      type: 'richText',
      label: 'Key Points / Pearls',
      admin: {
        description: 'Quick-reference items by level',
      },
      editor: getSimpleProtocolEditor(),
    },

    // References & Graphics
    {
      name: 'references',
      type: 'richText',
      label: 'References & Graphics',
      admin: {
        description: 'Tables, diagrams, assessment reminders',
      },
      editor: getReferencesEditor(),
    },

    // Version & Review Information
    {
      type: 'row',
      fields: [
        {
          name: 'effectiveDate',
          type: 'date',
          label: 'Effective Date',
          required: true,
          admin: {
            date: {
              pickerAppearance: 'dayOnly',
            },
          },
        },
        {
          name: 'lastReviewed',
          type: 'date',
          label: 'Last Reviewed',
          required: false,
          admin: {
            date: {
              pickerAppearance: 'dayOnly',
            },
          },
        },
      ],
    },
    {
      name: 'versionNumber',
      type: 'text',
      label: 'Version',
      required: true,
      admin: {
        placeholder: 'e.g., v2.1',
      },
    },

    // Related Tools (for future implementation)
    // Commented out until Tools collection is created
    // {
    //   name: 'tools',
    //   type: 'relationship',
    //   relationTo: 'tools',
    //   hasMany: true,
    //   admin: {
    //     description: 'Quick tools/calculators for this protocol',
    //   },
    // },

    // Supporting Documents
    {
      name: 'attachments',
      type: 'relationship',
      relationTo: 'media',
      hasMany: true,
      label: 'Supporting Documents/Images',
      admin: {
        description: 'Diagrams, flowcharts, reference images, or PDFs',
      },
    },

    // Search & Discovery
    {
      name: 'keywords',
      type: 'text',
      label: 'Search Keywords',
      required: true,
      admin: {
        description:
          'Comma-separated keywords for search (e.g., chest pain, STEMI, aspirin, nitroglycerin)',
      },
    },
  ],
}
