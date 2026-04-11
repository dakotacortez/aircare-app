'use client'

import { ListItemNode, ListNode } from '@lexical/list'
import { createClientFeature } from '@payloadcms/richtext-lexical/client'

export const ListBaseFeatureClient = createClientFeature(() => ({
  // Cast for compatibility when duplicate lexical versions are present in node_modules.
  nodes: [ListNode, ListItemNode] as unknown as never[],
}))
