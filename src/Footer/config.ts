import type { GlobalConfig } from 'payload'

import { link } from '@/fields/link'
import { revalidateFooter } from './hooks/revalidateFooter'
import { isAdmin } from '@/access/roles'

export const Footer: GlobalConfig = {
  slug: 'footer',
  access: {
    read: () => true,
    update: isAdmin, // Only Admin Team can update global footer
  },
  admin: {
    group: 'Administration',
    description: 'Site footer configuration (admin only)',
  },
  fields: [
    {
      name: 'navItems',
      type: 'array',
      fields: [
        link({
          appearances: false,
        }),
      ],
      maxRows: 6,
      admin: {
        initCollapsed: true,
        components: {
          RowLabel: '@/Footer/RowLabel#RowLabel',
        },
      },
    },
  ],
  hooks: {
    afterChange: [revalidateFooter],
  },
}
