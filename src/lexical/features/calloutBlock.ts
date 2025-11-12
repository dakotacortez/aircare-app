/**
 * Callout Block Feature for PayloadCMS Lexical Editor
 * Provides preset-based callout blocks (Medical Control, Important, Note, etc.)
 */

import { createServerFeature } from '@payloadcms/richtext-lexical'
import { CalloutBlockNode } from '../nodes/CalloutBlockNode'

export const CalloutBlockFeature = createServerFeature({
  feature: () => {
    return {
      ClientFeature: '@/lexical/features/calloutBlock/client#CalloutBlockFeatureClient',
      clientFeatureProps: {},
      nodes: [
        {
          node: CalloutBlockNode,
          type: CalloutBlockNode.getType(),
        },
      ],
    }
  },
  key: 'calloutBlock',
})
