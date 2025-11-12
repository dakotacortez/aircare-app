'use client'

import { ListItemNode, ListNode } from '@lexical/list'
import { createClientFeature } from '@payloadcms/richtext-lexical/client'

export const ListBaseFeatureClient = createClientFeature(() => ({
  nodes: [ListNode, ListItemNode],
}))

