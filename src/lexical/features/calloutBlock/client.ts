'use client'

import { createClientFeature } from '@payloadcms/richtext-lexical/dist/utilities/createClientFeature.js'

import { CalloutBlockNode } from '@/lexical/nodes/CalloutBlockNode'

export const CalloutBlockFeatureClient = createClientFeature(() => {
  return {
    nodes: [CalloutBlockNode],
    plugins: [
      {
        Component: () =>
          import('../../plugins/CalloutBlockPlugin').then((m) => m.CalloutBlockPlugin),
        position: 'normal',
      },
    ],
    sanitizedClientFeatureProps: {},
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
                import('../../plugins/CalloutBlockPlugin').then(
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
                import('../../plugins/CalloutBlockPlugin').then(
                  (m) => m.CalloutBlockToolbarDropdown,
                ),
            },
          ],
        },
      ],
    },
  }
})
