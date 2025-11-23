import type { CollectionConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { populateDefaultSections } from './Protocols/hooks/populateDefaultSections'
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
  FixedToolbarFeature,
  InlineToolbarFeature,
  TextStateFeature,
  defaultColors,
} from '@payloadcms/richtext-lexical'
import { isContentTeamOrAdmin } from '../access/isContentTeamOrAdmin'
import { isAdmin } from '../access/isAdmin'
import { generatePreviewPath } from '../utilities/generatePreviewPath'

/**
 * Shared Lexical Editor Features
 * Base feature set for all protocol rich text fields
 */
const getBaseFeatures = () => [
  ParagraphFeature(),
  BoldFeature(),
  ItalicFeature(),
  UnderlineFeature(),
  StrikethroughFeature(),
  InlineCodeFeature(),
  SuperscriptFeature(),
  SubscriptFeature(),
  TextStateFeature({
    state: {
      color: defaultColors.text,
    },
  }),
  AlignFeature(),
  IndentFeature(),
  OrderedListFeature(),
  UnorderedListFeature(),
  ChecklistFeature(),
  BlockquoteFeature(),
  FixedToolbarFeature(),
  InlineToolbarFeature(),
]

/**
 * Full protocol editor (with headings, links, and horizontal rules)
 */
const getFullProtocolEditor = () =>
  lexicalEditor({
    features: [
      ...getBaseFeatures(),
      HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
      HorizontalRuleFeature(),
      LinkFeature({ enabledCollections: ['protocols'] }),
    ],
  })

/**
 * Simple editor for bullet lists and rich text sections
 */
const getSimpleEditor = () =>
  lexicalEditor({
    features: [
      ...getBaseFeatures(),
      HeadingFeature({ enabledHeadingSizes: ['h3', 'h4'] }),
      LinkFeature({ enabledCollections: ['protocols'] }),
    ],
  })

/**
 * Protocols Collection
 * Overhauled with sections-based structure for actionable protocols
 */
export const Protocols: CollectionConfig = {
  slug: 'protocols',
  labels: {
    singular: 'Protocol',
    plural: 'Protocols',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['code', 'title', 'category', 'lastModified'],
    group: 'Clinical Content',
    listSearchableFields: ['title', 'code', 'keywords'],
    description: 'Clinical protocols with structured sections and action steps',
    livePreview: {
      url: ({ data, req }) =>
        generatePreviewPath({
          slug: data?.code,
          collection: 'protocols',
          req,
        }),
    },
    preview: (data, { req }) =>
      generatePreviewPath({
        slug: data?.code as string,
        collection: 'protocols',
        req,
      }),
    },
    orderable: true,
    access: {
      read: ({ req: { user } }) => {
        if (!user) return false
        if (user.status !== 'active') return false
        if (user.role === 'content-team' || user.role === 'admin-team') {
          return true
        }
        if (user.role === 'user' && user.approved) {
          return {
            _status: {
              equals: 'published',
            },
          }
        }
        return false
      },
      create: isContentTeamOrAdmin,
      update: isContentTeamOrAdmin,
      delete: isAdmin,
    },
    versions: {
      drafts: {
        autosave: {
          interval: 5000, // 5 seconds to keep live preview nearly real-time
        },
      },
      maxPerDoc: 25,
    },
    fields: [
      // Basic Protocol Info
    {
      name: 'code',
      type: 'text',
      required: true,
      unique: true,
      label: 'Protocol Code',
      admin: {
        description: 'Protocol code (e.g., SB204, T705, M301)',
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Protocol Name',
      admin: {
        placeholder: 'e.g., Cardiac Arrest',
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
          label: 'Subcategory',
          admin: {
            placeholder: 'e.g., Cardiovascular, Respiratory',
          },
        },
      ],
    },
    {
      name: 'lastModified',
      type: 'text',
      label: 'Last Modified',
      admin: {
        description: 'Year last modified (e.g., 2024)',
      },
    },

    // Protocol Content (Sections)
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Protocol Content',
          fields: [
            {
              name: 'sections',
              type: 'array',
              required: true,
              label: 'Protocol Sections',
              admin: {
                description:
                  'Sections are drag-and-drop sortable! Use the ⋮⋮ handle to reorder.',
              },
              hooks: {
                beforeValidate: [populateDefaultSections],
              },
              fields: [
                {
                  name: 'heading',
                  type: 'text',
                  required: true,
                  label: 'Section Heading',
                  admin: {
                    description: 'e.g., "Inclusion Criteria", "Protocol", "Differential Diagnosis"',
                  },
                },
                {
                  name: 'scope',
                  type: 'select',
                  hasMany: true,
                  defaultValue: [],
                  label: 'Certification Scope',
                  options: [
                    { label: 'BLS/EMT', value: 'BLS' },
                    { label: 'ALS/Paramedic', value: 'ALS' },
                    { label: 'CCT', value: 'CCT' },
                  ],
                  admin: {
                    description:
                      'Who can view/perform this section. Leave empty for all certification levels.',
                  },
                },
                {
                  name: 'note',
                  type: 'textarea',
                  label: 'Alert/Note',
                  admin: {
                    description: 'Optional alert/note to show at top of section',
                  },
                },
                {
                  name: 'contentType',
                  type: 'radio',
                  required: true,
                  defaultValue: 'actionSteps',
                  label: 'Content Type',
                  options: [
                    {
                      label: 'Action Steps (numbered protocol steps with timing/badges)',
                      value: 'actionSteps',
                    },
                    {
                      label: 'Bullet List (simple items like inclusion criteria)',
                      value: 'bulletList',
                    },
                    {
                      label: 'Rich Text (paragraphs for complex notes)',
                      value: 'richText',
                    },
                  ],
                  admin: {
                    description: 'How should this section be displayed?',
                  },
                },
                // Bullet List (Lexical editor for rich formatting)
                {
                  name: 'bulletList',
                  type: 'richText',
                  label: 'Bullet List Content',
                  admin: {
                    condition: (data, siblingData) => siblingData.contentType === 'bulletList',
                    description: 'Use the editor to create formatted bullet lists',
                  },
                  editor: getSimpleEditor(),
                },
                // Rich Text
                {
                  name: 'richText',
                  type: 'richText',
                  label: 'Rich Text Content',
                  admin: {
                    condition: (data, siblingData) => siblingData.contentType === 'richText',
                  },
                  editor: getFullProtocolEditor(),
                },
                // Action Steps (structured array)
                {
                  name: 'actionSteps',
                  type: 'array',
                  label: 'Action Steps',
                  admin: {
                    condition: (data, siblingData) => siblingData.contentType === 'actionSteps',
                  },
                  fields: [
                    {
                      name: 'stepNumber',
                      type: 'number',
                      required: true,
                      label: 'Step Number',
                      admin: {
                        description: 'Step number (can use decimals like 3.5 for inserted steps)',
                        step: 0.1,
                      },
                    },
                    {
                      name: 'action',
                      type: 'textarea',
                      required: true,
                      label: 'Action',
                      admin: {
                        description: 'Main action text',
                      },
                    },
                    {
                      name: 'scope',
                      type: 'select',
                      hasMany: true,
                      defaultValue: [],
                      label: 'Certification Scope',
                      options: [
                        { label: 'BLS/EMT', value: 'BLS' },
                        { label: 'ALS/Paramedic', value: 'ALS' },
                        { label: 'CCT', value: 'CCT' },
                      ],
                      admin: {
                        description: 'Who can perform this step. Leave empty for all levels.',
                      },
                    },
                    {
                      name: 'timing',
                      type: 'text',
                      label: 'Timing',
                      admin: {
                        description: 'Timing indicator (e.g., "q3-5min", "continuous", "q2min")',
                        placeholder: 'Leave blank if not time-sensitive',
                      },
                    },
                    {
                      name: 'requiresMedControl',
                      type: 'checkbox',
                      defaultValue: false,
                      label: 'Requires Medical Control',
                      admin: {
                        description: 'Check if this step requires medical control authorization',
                      },
                    },
                    {
                      name: 'protocolReferences',
                      type: 'array',
                      label: 'Protocol References',
                      admin: {
                        description: 'Other protocols referenced in this step (for navigation)',
                      },
                      fields: [
                        {
                          name: 'protocol',
                          type: 'relationship',
                          relationTo: 'protocols',
                          required: true,
                          label: 'Protocol',
                        },
                        {
                          name: 'label',
                          type: 'text',
                          label: 'Display Label',
                          admin: {
                            description: 'Text to display (e.g., "T508", "VF/VT Protocol")',
                          },
                        },
                      ],
                    },
                    {
                      name: 'details',
                      type: 'array',
                      label: 'Details',
                      admin: {
                        description: 'Sub-bullets or additional details',
                      },
                      fields: [
                        {
                          name: 'detail',
                          type: 'textarea',
                          required: true,
                          label: 'Detail',
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Medications',
          fields: [
            {
              name: 'medications',
              type: 'relationship',
              relationTo: 'medications',
              hasMany: true,
              label: 'Medications',
              admin: {
                description: 'Link medications used in this protocol',
              },
            },
          ],
        },
        {
          label: 'Related Protocols',
          fields: [
            {
              name: 'relatedProtocols',
              type: 'relationship',
              relationTo: 'protocols',
              hasMany: true,
              label: 'Related Protocols',
              admin: {
                description: 'Other protocols referenced in this one',
              },
            },
          ],
        },
        {
          label: 'Search & Tags',
          fields: [
            {
              name: 'keywords',
              type: 'text',
              label: 'Search Keywords',
              required: true,
              admin: {
                description: 'Comma-separated keywords for search',
              },
            },
            {
              name: 'tags',
              type: 'select',
              hasMany: true,
              label: 'Tags',
              options: [
                { label: 'Cardiac', value: 'cardiac' },
                { label: 'Respiratory', value: 'respiratory' },
                { label: 'Trauma', value: 'trauma' },
                { label: 'Neurological', value: 'neurological' },
                { label: 'Pediatric', value: 'pediatric' },
                { label: 'Critical', value: 'critical' },
              ],
            },
          ],
        },
      ],
    },

    // Version Information
    {
      type: 'row',
      fields: [
        {
          name: 'effectiveDate',
          type: 'date',
          label: 'Effective Date',
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
          admin: {
            date: {
              pickerAppearance: 'dayOnly',
            },
          },
        },
      ],
    },

    // Calculator Overrides
    {
      name: 'calculatorOverrides',
      type: 'array',
      label: 'Calculator Overrides',
      admin: {
        description: 'Override which calculators are shown and their order for this protocol',
      },
      fields: [
        {
          name: 'calculator',
          type: 'relationship',
          relationTo: 'calculators',
          required: true,
          label: 'Calculator',
        },
        {
          name: 'order',
          type: 'number',
          label: 'Order',
          admin: {
            description: "Override the calculator's defaultOrder for this protocol",
          },
        },
        {
          name: 'hidden',
          type: 'checkbox',
          label: 'Hidden',
          defaultValue: false,
          admin: {
            description:
              'If true, hide this calculator for this protocol even if tags would otherwise match',
          },
        },
      ],
    },

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
  ],
}
