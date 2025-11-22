import type { GlobalConfig } from 'payload'
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
  FixedToolbarFeature,
  InlineToolbarFeature,
  TextStateFeature,
  defaultColors,
} from '@payloadcms/richtext-lexical'
import { isContentTeamOrAdmin } from '@/access/isContentTeamOrAdmin'

/**
 * Shared Lexical Editor Features
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

const getFullProtocolEditor = () =>
  lexicalEditor({
    features: [
      ...getBaseFeatures(),
      HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
      HorizontalRuleFeature(),
      LinkFeature({ enabledCollections: ['protocols'] }),
    ],
  })

const getSimpleEditor = () =>
  lexicalEditor({
    features: [
      ...getBaseFeatures(),
      HeadingFeature({ enabledHeadingSizes: ['h3', 'h4'] }),
      LinkFeature({ enabledCollections: ['protocols'] }),
    ],
  })

/**
 * Protocol Defaults Global
 * Configure default sections that appear when creating new protocols
 */
export const ProtocolDefaults: GlobalConfig = {
  slug: 'protocol-defaults',
  label: 'Protocol Defaults',
  access: {
    read: () => true,
    update: isContentTeamOrAdmin,
  },
  admin: {
    group: 'Clinical Content',
    description: 'Configure default sections for new protocols',
  },
  fields: [
    {
      name: 'defaultSections',
      type: 'array',
      label: 'Default Protocol Sections',
      admin: {
        description:
          'These sections will automatically populate when creating a new protocol. Drag to reorder using the ⋮⋮ handle.',
      },
      defaultValue: [
        {
          heading: 'Inclusion Criteria',
          scope: [],
          contentType: 'bulletList',
        },
        {
          heading: 'Exclusion Criteria',
          scope: [],
          contentType: 'bulletList',
        },
        {
          heading: 'Protocol',
          scope: [],
          contentType: 'actionSteps',
          actionSteps: [],
        },
        {
          heading: 'Key Considerations',
          scope: [],
          contentType: 'bulletList',
        },
        {
          heading: 'Differential Diagnosis',
          scope: [],
          contentType: 'bulletList',
        },
        {
          heading: "H's & T's",
          scope: [],
          contentType: 'bulletList',
        },
      ],
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
            description: 'Who can view/perform this section. Leave empty for all certification levels.',
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
          defaultValue: 'bulletList',
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
        // Bullet List
        {
          name: 'bulletList',
          type: 'richText',
          label: 'Bullet List Content',
          admin: {
            condition: (data, siblingData) => siblingData.contentType === 'bulletList',
            description: 'Pre-fill content for this section (optional)',
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
            description: 'Pre-fill content for this section (optional)',
          },
          editor: getFullProtocolEditor(),
        },
        // Action Steps
        {
          name: 'actionSteps',
          type: 'array',
          label: 'Action Steps',
          admin: {
            condition: (data, siblingData) => siblingData.contentType === 'actionSteps',
            description: 'Pre-fill action steps for this section (optional)',
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
}
