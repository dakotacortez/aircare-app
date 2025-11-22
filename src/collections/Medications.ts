import type { CollectionConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import {
  BoldFeature,
  ItalicFeature,
  UnderlineFeature,
  ParagraphFeature,
  OrderedListFeature,
  UnorderedListFeature,
  FixedToolbarFeature,
  InlineToolbarFeature,
} from '@payloadcms/richtext-lexical'
import { isContentTeamOrAdmin } from '../access/isContentTeamOrAdmin'
import { isAdmin } from '../access/isAdmin'

/**
 * Simple rich text editor for medication fields
 */
const getMedicationEditor = () =>
  lexicalEditor({
    features: [
      ParagraphFeature(),
      BoldFeature(),
      ItalicFeature(),
      UnderlineFeature(),
      OrderedListFeature(),
      UnorderedListFeature(),
      FixedToolbarFeature(),
      InlineToolbarFeature(),
    ],
  })

/**
 * Medications Collection
 * Comprehensive medication reference with dosing, indications, contraindications
 */
export const Medications: CollectionConfig = {
  slug: 'medications',
  labels: {
    singular: 'Medication',
    plural: 'Medications',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'class', 'scope'],
    group: 'Clinical Content',
    description: 'Medication reference database with dosing and clinical information',
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.status !== 'active') return false
      if (user.role === 'content-team' || user.role === 'admin-team') {
        return true
      }
      if (user.role === 'user' && user.approved) {
        return true
      }
      return false
    },
    create: isContentTeamOrAdmin,
    update: isContentTeamOrAdmin,
    delete: isAdmin,
  },
  fields: [
    // Basic Info
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
      label: 'Medication Name',
      admin: {
        placeholder: 'e.g., Epinephrine, Amiodarone',
      },
    },
    {
      name: 'genericName',
      type: 'text',
      label: 'Generic Name',
      admin: {
        description: 'Generic name if different from brand name',
        placeholder: 'e.g., Acetaminophen for Tylenol',
      },
    },
    {
      name: 'class',
      type: 'select',
      required: true,
      label: 'Drug Class',
      options: [
        { label: 'Vasopressor', value: 'vasopressor' },
        { label: 'Antiarrhythmic', value: 'antiarrhythmic' },
        { label: 'Analgesic', value: 'analgesic' },
        { label: 'Sedative', value: 'sedative' },
        { label: 'Antiemetic', value: 'antiemetic' },
        { label: 'Bronchodilator', value: 'bronchodilator' },
        { label: 'Anticonvulsant', value: 'anticonvulsant' },
        { label: 'Antihypertensive', value: 'antihypertensive' },
        { label: 'Antiplatelet', value: 'antiplatelet' },
        { label: 'Anticoagulant', value: 'anticoagulant' },
        { label: 'Paralytic', value: 'paralytic' },
        { label: 'Reversal Agent', value: 'reversal' },
        { label: 'Other', value: 'other' },
      ],
    },
    {
      name: 'scope',
      type: 'select',
      hasMany: true,
      required: true,
      defaultValue: ['ALS', 'CCT'],
      label: 'Certification Scope',
      options: [
        { label: 'BLS/EMT', value: 'BLS' },
        { label: 'ALS/Paramedic', value: 'ALS' },
        { label: 'CCT', value: 'CCT' },
      ],
      admin: {
        description: 'Who can administer this medication',
      },
    },

    // Tabs for organized content
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Dosing',
          fields: [
            {
              name: 'doses',
              type: 'array',
              required: true,
              label: 'Dosing Information',
              admin: {
                description: 'Add a row for each route (IV, IM, PO, etc.)',
              },
              fields: [
                {
                  name: 'route',
                  type: 'select',
                  required: true,
                  label: 'Route of Administration',
                  options: [
                    { label: 'IV', value: 'IV' },
                    { label: 'IO', value: 'IO' },
                    { label: 'IV/IO', value: 'IV/IO' },
                    { label: 'IM', value: 'IM' },
                    { label: 'SQ', value: 'SQ' },
                    { label: 'PO', value: 'PO' },
                    { label: 'SL', value: 'SL' },
                    { label: 'Intranasal', value: 'IN' },
                    { label: 'Inhalation', value: 'INH' },
                    { label: 'ET', value: 'ET' },
                    { label: 'Rectal', value: 'PR' },
                  ],
                },
                {
                  name: 'adultDose',
                  type: 'text',
                  required: true,
                  label: 'Adult Dose',
                  admin: {
                    placeholder: 'e.g., 1mg, 300mg, 0.3mg, 2-10mcg/min',
                  },
                },
                {
                  name: 'pediatricDose',
                  type: 'text',
                  label: 'Pediatric Dose',
                  admin: {
                    placeholder: 'e.g., 0.01mg/kg, 5mg/kg (max 300mg)',
                  },
                },
                {
                  name: 'concentration',
                  type: 'text',
                  label: 'Concentration',
                  admin: {
                    placeholder: 'e.g., 1mg/mL, 10mg/mL',
                  },
                },
                {
                  name: 'interval',
                  type: 'text',
                  label: 'Interval',
                  admin: {
                    placeholder: 'e.g., q3-5min, one time dose, PRN',
                  },
                },
                {
                  name: 'maxDose',
                  type: 'text',
                  label: 'Maximum Dose',
                  admin: {
                    placeholder: 'e.g., 300mg max, 3 doses max',
                  },
                },
                {
                  name: 'rate',
                  type: 'text',
                  label: 'Administration Rate',
                  admin: {
                    placeholder: 'e.g., over 2 minutes, slow IVP',
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'Clinical Info',
          fields: [
            {
              name: 'indications',
              type: 'richText',
              required: true,
              label: 'Indications',
              admin: {
                description: 'When to use this medication',
              },
              editor: getMedicationEditor(),
            },
            {
              name: 'contraindications',
              type: 'richText',
              label: 'Contraindications',
              admin: {
                description: 'When NOT to use this medication',
              },
              editor: getMedicationEditor(),
            },
            {
              name: 'precautions',
              type: 'richText',
              label: 'Precautions',
              admin: {
                description: 'Special considerations or warnings',
              },
              editor: getMedicationEditor(),
            },
            {
              name: 'mechanismOfAction',
              type: 'richText',
              label: 'Mechanism of Action',
              admin: {
                description: 'How the medication works (optional, for education)',
              },
              editor: getMedicationEditor(),
            },
            {
              name: 'onset',
              type: 'text',
              label: 'Onset',
              admin: {
                placeholder: 'e.g., 30-60 seconds, 2-5 minutes',
              },
            },
            {
              name: 'duration',
              type: 'text',
              label: 'Duration',
              admin: {
                placeholder: 'e.g., 5-10 minutes, 4-6 hours',
              },
            },
            {
              name: 'sideEffects',
              type: 'richText',
              label: 'Side Effects',
              admin: {
                description: 'Common and serious adverse effects',
              },
              editor: getMedicationEditor(),
            },
          ],
        },
        {
          label: 'Preparation & Admin',
          fields: [
            {
              name: 'mixing',
              type: 'richText',
              label: 'Mixing Instructions',
              admin: {
                description: 'How to mix/prepare the medication',
              },
              editor: getMedicationEditor(),
            },
            {
              name: 'compatibility',
              type: 'richText',
              label: 'Compatibility',
              admin: {
                description: 'What it can/cannot be mixed with',
              },
              editor: getMedicationEditor(),
            },
            {
              name: 'titration',
              type: 'richText',
              label: 'Titration Guidelines',
              admin: {
                description: 'Titration guidelines (for infusions)',
              },
              editor: getMedicationEditor(),
            },
            {
              name: 'specialInstructions',
              type: 'richText',
              label: 'Special Instructions',
              admin: {
                description: 'Any special administration instructions',
              },
              editor: getMedicationEditor(),
            },
          ],
        },
        {
          label: 'Additional Info',
          fields: [
            {
              name: 'pregnancyCategory',
              type: 'select',
              label: 'Pregnancy Category',
              options: [
                { label: 'A', value: 'A' },
                { label: 'B', value: 'B' },
                { label: 'C', value: 'C' },
                { label: 'D', value: 'D' },
                { label: 'X', value: 'X' },
              ],
            },
            {
              name: 'notes',
              type: 'richText',
              label: 'Notes',
              admin: {
                description: 'Any additional notes or pearls',
              },
              editor: getMedicationEditor(),
            },
          ],
        },
      ],
    },
  ],
}
