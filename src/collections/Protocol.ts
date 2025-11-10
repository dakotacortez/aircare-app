import type { CollectionConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import {
  BoldFeature,
  ItalicFeature,
  UnderlineFeature,
  StrikethroughFeature,
  HeadingFeature,
  OrderedListFeature,
  UnorderedListFeature,
  LinkFeature,
  ParagraphFeature,
} from '@payloadcms/richtext-lexical'
import { CertificationLevelFeature } from '../lexical/features/certificationLevel'

/**
 * Protocol Collection (singular)
 * Fresh collection with orderable enabled from the start
 * Uses built-in _status (draft/published) instead of custom status enum
 */
export const Protocol: CollectionConfig = {
  slug: 'protocol',
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
      label: 'Protocol Number',
      admin: {
        placeholder: 'e.g., MED-CARD-001',
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

    // Main Protocol Content with Certification Level Feature
    {
      name: 'content',
      type: 'richText',
      label: 'Protocol Content',
      required: true,
      admin: {
        description:
          'Main protocol content - Select text and use "Cert Level" button to tag ALS/CCT/Physician-only content',
      },
      editor: lexicalEditor({
        features: [
          ParagraphFeature(),
          HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
          BoldFeature(),
          ItalicFeature(),
          UnderlineFeature(),
          StrikethroughFeature(),
          OrderedListFeature(),
          UnorderedListFeature(),
          LinkFeature({
            enabledCollections: ['protocol'],
          }),
          // Our custom certification level feature
          CertificationLevelFeature(),
        ],
      }),
    },

    // Special Considerations
    {
      name: 'considerations',
      type: 'richText',
      label: 'Special Considerations',
      admin: {
        description: 'Special considerations, precautions, or warnings',
      },
      editor: lexicalEditor({
        features: [
          ParagraphFeature(),
          HeadingFeature({ enabledHeadingSizes: ['h3', 'h4'] }),
          BoldFeature(),
          ItalicFeature(),
          UnorderedListFeature(),
          OrderedListFeature(),
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
          required: true,
          admin: {
            date: {
              pickerAppearance: 'dayOnly',
            },
          },
        },
        {
          name: 'nextReview',
          type: 'date',
          label: 'Next Review Due',
          required: true,
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
