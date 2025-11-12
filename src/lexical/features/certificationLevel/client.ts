'use client'

import { createClientFeature } from '@payloadcms/richtext-lexical/dist/utilities/createClientFeature.js'

import { CertificationLevelNode } from '@/lexical/nodes/CertificationLevelNode'

export const CertificationLevelFeatureClient = createClientFeature(() => {
  return {
    nodes: [CertificationLevelNode],
    plugins: [
      {
        Component: () =>
          import('../../plugins/CertificationLevelPlugin').then(
            (m) => m.CertificationLevelPlugin,
          ),
        position: 'normal',
      },
    ],
    sanitizedClientFeatureProps: {},
    toolbarFixed: {
      groups: [
        {
          type: 'dropdown',
          key: 'cert-level',
          order: 65,
          items: [
            {
              key: 'cert-level',
              label: 'Certification level',
              Component: () =>
                import('../../plugins/CertificationLevelPlugin').then(
                  (m) => m.CertificationLevelToolbarDropdown,
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
          key: 'cert-level',
          order: 65,
          items: [
            {
              key: 'cert-level',
              label: 'Certification level',
              Component: () =>
                import('../../plugins/CertificationLevelPlugin').then(
                  (m) => m.CertificationLevelToolbarDropdown,
                ),
            },
          ],
        },
      ],
    },
  }
})
