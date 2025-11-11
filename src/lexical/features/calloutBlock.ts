/**
 * Callout Block Feature for PayloadCMS Lexical Editor
 * Provides preset-based callout blocks (Medical Control, Important, Note, etc.)
 */

import type { FeatureProviderServer } from '@payloadcms/richtext-lexical'
import { CalloutBlockNode } from '../nodes/CalloutBlockNode'

export const CalloutBlockFeature = (): FeatureProviderServer<any, any, any> => {
  return {
    feature: () => {
      return {
        nodes: [
          {
            node: CalloutBlockNode,
            type: CalloutBlockNode.getType(),
          },
        ],
        clientFeature: {
          plugins: [
            {
              Component: () =>
                import('../plugins/CalloutBlockPlugin').then((m) => m.CalloutBlockPlugin),
              position: 'normal',
            },
          ],
          toolbarInline: {
            groups: [
              {
                type: 'dropdown',
                ChildComponent: () =>
                  import('../plugins/CalloutBlockPlugin').then(
                    (m) => m.CalloutBlockToolbarButton,
                  ),
                key: 'callout-block',
              },
            ],
          },
        },
      }
    },
    key: 'calloutBlock',
    serverFeatureProps: undefined,
  }
}
