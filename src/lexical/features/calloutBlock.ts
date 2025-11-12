/**
 * Callout Block Feature for PayloadCMS Lexical Editor
 * Provides preset-based callout blocks (Medical Control, Important, Note, etc.)
 */

import type { FeatureProviderServer } from '@payloadcms/richtext-lexical'
import { CalloutBlockNode } from '../nodes/CalloutBlockNode'

const createToolbarGroups = () => [
  {
    type: 'dropdown' as const,
    key: 'callout-block',
    items: [
      {
        key: 'callout-block',
        label: 'Insert callout',
        Component: () =>
          import('../plugins/CalloutBlockPlugin').then(
            (m) => m.CalloutBlockToolbarDropdown,
          ),
        order: 60,
      },
    ],
  },
]

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
          toolbarFixed: {
            groups: createToolbarGroups(),
          },
          toolbarInline: {
            groups: createToolbarGroups(),
          },
        },
      }
    },
    key: 'calloutBlock',
    serverFeatureProps: undefined,
  }
}
