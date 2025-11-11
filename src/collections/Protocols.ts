import type { CollectionConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import {
  BoldFeature,
  ItalicFeature,
  UnderlineFeature,
  HeadingFeature,
  OrderedListFeature,
  UnorderedListFeature,
  LinkFeature,
  ParagraphFeature,
  UploadFeature,
} from '@payloadcms/richtext-lexical'
import { CertificationLevelFeature } from '../lexical/features/certificationLevel'
import { CalloutBlockFeature } from '../lexical/features/calloutBlock'

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
    // Enable duplicate button in list and document views
    enableDuplicate: true,
  },
  // Enable orderable from DAY ONE (before any data exists)
  orderable: true,
  access: {
    read: () => true, // Public read for field crews
    create: ({ req: { user } }) => !!user, // Only logged in users
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => !!user,
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
      validate: (value: string) => {
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
      editor: lexicalEditor({
        features: [
          ParagraphFeature(),
          HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
          BoldFeature(),
          ItalicFeature(),
          UnderlineFeature(),
          OrderedListFeature(),
          UnorderedListFeature(),
          LinkFeature({
            enabledCollections: ['protocols'],
          }),
          CalloutBlockFeature(),
          CertificationLevelFeature(),
        ],
      }),
    },

    // BLS-Specific Content
    {
      name: 'contentBLS',
      type: 'richText',
      label: 'Protocol (BLS)',
      admin: {
        description: 'BLS-specific procedures and protocols',
      },
      editor: lexicalEditor({
        features: [
          ParagraphFeature(),
          HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
          BoldFeature(),
          ItalicFeature(),
          UnderlineFeature(),
          OrderedListFeature(),
          UnorderedListFeature(),
          LinkFeature({
            enabledCollections: ['protocols'],
          }),
          CalloutBlockFeature(),
          CertificationLevelFeature(),
        ],
      }),
    },

    // ALS-Specific Content
    {
      name: 'contentALS',
      type: 'richText',
      label: 'Protocol (ALS)',
      admin: {
        description: 'ALS-specific procedures and protocols',
      },
      editor: lexicalEditor({
        features: [
          ParagraphFeature(),
          HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
          BoldFeature(),
          ItalicFeature(),
          UnderlineFeature(),
          OrderedListFeature(),
          UnorderedListFeature(),
          LinkFeature({
            enabledCollections: ['protocols'],
          }),
          CalloutBlockFeature(),
          CertificationLevelFeature(),
        ],
      }),
    },

    // CCT-Specific Content
    {
      name: 'contentCCT',
      type: 'richText',
      label: 'Protocol (CCT)',
      admin: {
        description: 'CCT-specific procedures and protocols',
      },
      editor: lexicalEditor({
        features: [
          ParagraphFeature(),
          HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
          BoldFeature(),
          ItalicFeature(),
          UnderlineFeature(),
          OrderedListFeature(),
          UnorderedListFeature(),
          LinkFeature({
            enabledCollections: ['protocols'],
          }),
          CalloutBlockFeature(),
          CertificationLevelFeature(),
        ],
      }),
    },

    // Special Considerations (shared across all levels)
    {
      name: 'specialConsiderations',
      type: 'richText',
      label: 'Special Considerations',
      admin: {
        description: 'Level-specific callouts and uncommon adjustments',
      },
      editor: lexicalEditor({
        features: [
          ParagraphFeature(),
          HeadingFeature({ enabledHeadingSizes: ['h3', 'h4'] }),
          BoldFeature(),
          ItalicFeature(),
          UnorderedListFeature(),
          OrderedListFeature(),
          CalloutBlockFeature(),
          CertificationLevelFeature(),
        ],
      }),
    },

    // Key Points / Pearls
    {
      name: 'keyPoints',
      type: 'richText',
      label: 'Key Points / Pearls',
      admin: {
        description: 'Quick-reference items by level',
      },
      editor: lexicalEditor({
        features: [
          ParagraphFeature(),
          BoldFeature(),
          ItalicFeature(),
          UnorderedListFeature(),
          OrderedListFeature(),
          CalloutBlockFeature(),
          CertificationLevelFeature(),
        ],
      }),
    },

    // References & Graphics
    {
      name: 'references',
      type: 'richText',
      label: 'References & Graphics',
      admin: {
        description: 'Tables, diagrams, assessment reminders',
      },
      editor: lexicalEditor({
        features: [
          ParagraphFeature(),
          BoldFeature(),
          ItalicFeature(),
          UnorderedListFeature(),
          OrderedListFeature(),
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
          CalloutBlockFeature(),
          CertificationLevelFeature(),
        ],
      }),
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
