import type { CollectionConfig } from 'payload'

import { anyone } from '../access/anyone'
import { isAdmin } from '../access/roles'
import { slugField } from 'payload'

export const Categories: CollectionConfig = {
  slug: 'categories',
  access: {
    // Only admin team can manage categories
    create: isAdmin,
    delete: isAdmin,
    read: anyone,
    update: isAdmin,
  },
  admin: {
    group: 'Administration',
    description: 'Post categories (admin only)',
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    slugField({
      position: undefined,
    }),
  ],
}
