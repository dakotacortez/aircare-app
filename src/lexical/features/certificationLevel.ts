/**
 * Certification Level Feature for PayloadCMS Lexical Editor
 * Registers the custom node and plugin
 */

import type { FeatureProviderServer } from '@payloadcms/richtext-lexical'
import { CertificationLevelNode } from '../nodes/CertificationLevelNode'

/**
 * Feature configuration for certification level tagging
 * Use this in your collection's richText field configuration
 */
export const CertificationLevelFeature: FeatureProviderServer<any, any, any> = {
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
        toolbarInline: {
          groups: [
            {
              type: 'dropdown',
              ChildComponent: () =>
                import('../plugins/CertificationLevelPlugin').then(
                  (m) => m.CertificationLevelToolbarButton,
                ),
              key: 'cert-level',
            },
          ],
        },
      },
    }
  },
  key: 'certificationLevel',
}
