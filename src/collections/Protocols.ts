import type { CollectionConfig } from 'payload'

export const Protocols: CollectionConfig = {
  slug: 'protocols',
  labels: {
    singular: 'Protocol',
    plural: 'Protocols',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'subcategory', 'status', 'effectiveDate'],
    group: 'Clinical Content',
    defaultSort: 'sortOrder',
    listSearchableFields: ['title', 'protocolNumber', 'keywords'],
  },
access: {
    read: () => true, // Public read for field crews
    create: ({ req: { user } }) => !!user, // Only logged in users
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => !!user, // Any logged in user can delete
  },
versions: {
  drafts: {
    autosave: {
      interval: 120000, // Autosave every 2 minutes
    },
  },
  maxPerDoc: 25,
},
  fields: [
    {
      name: 'sortOrder',
      type: 'number',
      label: 'Sort Order',
      admin: {
        position: 'sidebar',
        description: 'Drag protocols in the list to reorder, or manually set order',
      },
      defaultValue: 10,
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Protocol Name',
      admin: {
        placeholder: 'e.g., Acute Myocardial Infarction (AMI)',
      },
    },
    {
      name: 'protocolNumber',
      type: 'text',
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
          label: 'Subcategory',
          admin: {
            placeholder: 'e.g., Cardiovascular, General Care',
          },
        },
      ],
    },
    {
      name: 'content',
      type: 'richText',
      label: 'Protocol Content',
      required: true,
      admin: {
        description: 'Main protocol content - use headings, lists, and formatting as needed',
      },
    },
    {
      name: 'indications',
      type: 'richText',
      label: 'Indications',
    },
    {
      name: 'contraindications',
      type: 'richText',
      label: 'Contraindications',
    },
    {
      name: 'considerations',
      type: 'richText',
      label: 'Special Considerations',
    },
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
      admin: {
        placeholder: 'e.g., v2.1',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Under Review', value: 'review' },
        { label: 'Active', value: 'active' },
        { label: 'Archived', value: 'archived' },
      ],
    },
//    {
//      name: 'relatedProtocols',
//      type: 'relationship',
//      relationTo: 'protocols',
//      hasMany: true,
//      label: 'Related Protocols',
//      admin: {
//        description: 'Link to related protocols (e.g., link AMI to Cardiogenic Shock)',
//      },
//    },
    {
      name: 'attachments',
      type: 'relationship',
      relationTo: 'media',
      hasMany: true,
      label: 'Supporting Documents/Images',
      admin: {
        description: 'Diagrams, flowcharts, reference images',
      },
    },
    {
      name: 'keywords',
      type: 'text',
      label: 'Search Keywords',
      admin: {
        description: 'Comma-separated keywords for search (e.g., heart attack, chest pain, STEMI)',
      },
    },
  ],
}
