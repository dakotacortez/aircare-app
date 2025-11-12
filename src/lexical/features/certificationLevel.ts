/**
 * Certification Level Feature for PayloadCMS Lexical Editor
 * Registers the custom node and plugin for inline ALS/CCT/Physician tagging
 */

import { createServerFeature } from '@payloadcms/richtext-lexical'
import { CertificationLevelNode } from '../nodes/CertificationLevelNode'

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
export const CertificationLevelFeature = createServerFeature({
  feature: () => {
    return {
      ClientFeature:
        '@/lexical/features/certificationLevel/client#CertificationLevelFeatureClient',
      clientFeatureProps: {},
      nodes: [
        {
          node: CertificationLevelNode,
          type: CertificationLevelNode.getType(),
        },
      ],
    }
  },
  key: 'certificationLevel',
})
