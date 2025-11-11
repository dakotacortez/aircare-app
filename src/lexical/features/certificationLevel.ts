/**
 * Certification Level Feature for PayloadCMS Lexical Editor
 * Registers the custom node and plugin for inline ALS/CCT/Physician tagging
 */

import { CertificationLevelNode } from '../nodes/CertificationLevelNode'

const createToolbarGroups = () => [
  {
    type: 'dropdown' as const,
    key: 'cert-level',
    items: [
      {
        key: 'cert-level',
        label: 'Certification level',
        Component: () =>
          import('../plugins/CertificationLevelPlugin').then(
            (m) => m.CertificationLevelToolbarDropdown,
          ),
        order: 65,
      },
    ],
  },
]

/**
 * Feature configuration for certification level tagging
 * Use this in your collection's richText field configuration
 *
 * @example
 * lexicalEditor({
 *   features: [
 *     // ... other features
 *     CertificationLevelFeature(),
 *   ],
 * })
 */
export const CertificationLevelFeature = () => {
  return {
    feature: () => {
      return {
        nodes: [
          {
            node: CertificationLevelNode,
            type: CertificationLevelNode.getType(),
          },
        ],
        // Client-side plugin will be loaded via ClientFeature
        clientFeature: {
          plugins: [
            {
              Component: () =>
                import('../plugins/CertificationLevelPlugin').then(
                  (m) => m.CertificationLevelPlugin,
                ),
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
    key: 'certificationLevel',
    serverFeatureProps: undefined,
  }
}
