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
      defaultColumns: ['name', 'class', 'updatedAt'],
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
        label: 'Alternate Names',
        admin: {
          description: 'List any alternate brand or generic names users may search for',
          placeholder: 'e.g., Acetaminophen, Tylenol, Paracetamol',
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
    // Tabs for organized content
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Dosing',
          fields: [
              {
                name: 'medicationIndications',
                type: 'array',
                required: true,
                label: 'Indication-Based Dosing',
                admin: {
                  description: 'Group routes/doses by clinical indication or condition',
                },
                fields: [
                  {
                    name: 'indication',
                    type: 'text',
                    required: true,
                    label: 'Indication / Condition',
                    admin: {
                      placeholder: 'e.g., Cardiac Arrest, Anaphylaxis, Bradycardia',
                    },
                  },
                  {
                    name: 'clinicalContext',
                    type: 'textarea',
                    label: 'Clinical Context',
                    admin: {
                      description: 'Optional summary, triggers, or special considerations',
                      placeholder: 'Use for pearls like “After 3rd shock” or “Suspected distributive shock”',
                    },
                  },
                  {
                    name: 'routes',
                    type: 'array',
                    required: true,
                    label: 'Routes for this indication',
                    admin: {
                      description: 'Add each unique route/dose/scope combination (IV push, infusion, IM, etc.)',
                    },
                    fields: [
                      {
                        name: 'route',
                        type: 'select',
                        required: true,
                        label: 'Route of Administration',
                        options: [
                          { label: 'IV Push', value: 'IV Push' },
                          { label: 'IV Infusion', value: 'IV Infusion' },
                          { label: 'IV', value: 'IV' },
                          { label: 'IO', value: 'IO' },
                          { label: 'IV/IO', value: 'IV/IO' },
                          { label: 'Push Dose', value: 'Push Dose' },
                          { label: 'IM', value: 'IM' },
                          { label: 'SQ', value: 'SQ' },
                          { label: 'PO', value: 'PO' },
                          { label: 'SL', value: 'SL' },
                          { label: 'Intranasal', value: 'IN' },
                          { label: 'Inhalation (Neb)', value: 'INH' },
                          { label: 'Endotracheal (ET)', value: 'ET' },
                          { label: 'Rectal (PR)', value: 'PR' },
                          { label: 'Topical / Transdermal', value: 'Topical' },
                          { label: 'Other', value: 'Other' },
                        ],
                      },
                      {
                        name: 'scope',
                        type: 'select',
                        hasMany: true,
                        label: 'Certification Scope',
                        required: true,
                        options: [
                          { label: 'BLS/EMT', value: 'BLS' },
                          { label: 'ALS/Paramedic', value: 'ALS' },
                          { label: 'CCT', value: 'CCT' },
                        ],
                        admin: {
                          description: 'Who may perform this specific route/dose',
                        },
                      },
                      {
                        name: 'adultDose',
                        type: 'text',
                        label: 'Adult Dose',
                        admin: {
                          placeholder: 'e.g., 1mg, 0.3mg, 2-10mcg/min, 0.1-0.5mcg/kg/min',
                        },
                      },
                      {
                        name: 'pediatricDose',
                        type: 'text',
                        label: 'Pediatric Dose',
                        admin: {
                          placeholder: 'e.g., 0.01mg/kg (max 1mg)',
                        },
                      },
                      {
                        name: 'concentration',
                        type: 'text',
                        label: 'Concentration',
                        admin: {
                          placeholder: 'e.g., 1:10,000, 4mg in 250mL',
                        },
                      },
                      {
                        name: 'interval',
                        type: 'text',
                        label: 'Interval',
                        admin: {
                          placeholder: 'e.g., Every 3-5 minutes, Continuous infusion',
                        },
                      },
                      {
                        name: 'maxDose',
                        type: 'text',
                        label: 'Maximum Dose',
                        admin: {
                          placeholder: 'e.g., No max, 3 doses, 2mg total',
                        },
                      },
                      {
                        name: 'rate',
                        type: 'text',
                        label: 'Administration Rate',
                        admin: {
                          placeholder: 'e.g., Slow IVP over 1 min, Titrate to effect',
                        },
                      },
                      {
                        name: 'titrationGoal',
                        type: 'text',
                        label: 'Titration Goal',
                        admin: {
                          placeholder: 'e.g., Maintain MAP > 65, HR > 60',
                        },
                      },
                      {
                        name: 'notes',
                        type: 'textarea',
                        label: 'Route Notes',
                        admin: {
                          placeholder: 'Use for prep, med control, mixing, pearls, etc.',
                        },
                      },
                    ],
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
