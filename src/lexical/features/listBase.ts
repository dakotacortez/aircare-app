/**
 * Ensures base list nodes are always registered, regardless of feature ordering.
 * Prevents parseEditorState errors when encountering existing `list` nodes.
 */

import { ListItemNode, ListNode } from '@lexical/list'
import { createServerFeature } from '@payloadcms/richtext-lexical'

export const ListBaseFeature = createServerFeature({
  feature: () => ({
    ClientFeature: '@/lexical/features/listBase/client#ListBaseFeatureClient',
    clientFeatureProps: {},
    nodes: [
      {
        node: ListNode,
        type: ListNode.getType(),
      },
      {
        node: ListItemNode,
        type: ListItemNode.getType(),
      },
    ],
  }),
  key: 'listBase',
})

