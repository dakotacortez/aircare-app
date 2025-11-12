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
          toolbarFixed: {
            groups: [
              {
                type: 'dropdown',
                key: 'callout-block',
                order: 60,
                items: [
                  {
                    key: 'callout-block',
                    label: 'Insert callout',
                    Component: () =>
                      import('../plugins/CalloutBlockPlugin').then(
                        (m) => m.CalloutBlockToolbarDropdown,
                      ),
                  },
                ],
              },
            ],
          },
          toolbarInline: {
            groups: [
              {
                type: 'dropdown',
                key: 'callout-block',
                order: 60,
                items: [
                  {
                    key: 'callout-block',
                    label: 'Insert callout',
                    Component: () =>
                      import('../plugins/CalloutBlockPlugin').then(
                        (m) => m.CalloutBlockToolbarDropdown,
                      ),
                  },
                ],
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
