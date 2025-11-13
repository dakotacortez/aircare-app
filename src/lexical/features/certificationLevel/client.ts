'use client'

import { createElement, type FC } from 'react'

import { createClientFeature } from '@payloadcms/richtext-lexical/client'

import { CertificationLevelNode } from '@/lexical/nodes/CertificationLevelNode'
import {
  CertificationLevelPlugin,
  CertificationLevelToolbarDropdown,
} from '../../plugins/CertificationLevelPlugin'

const CertificationLevelPluginComponent: FC<{ clientProps: undefined }> = () =>
  createElement(CertificationLevelPlugin)

export const CertificationLevelFeatureClient = createClientFeature(() => {
  return {
    nodes: [CertificationLevelNode],
    plugins: [
      {
        Component: CertificationLevelPluginComponent,
        position: 'normal',
      },
    ],
    toolbarFixed: {
      groups: [
        {
          type: 'buttons',
          key: 'cert-level',
          order: 65,
          items: [
            {
              key: 'cert-level',
              label: 'Certification level',
              Component: CertificationLevelToolbarDropdown,
            },
          ],
        },
      ],
    },
    toolbarInline: {
      groups: [
        {
          type: 'buttons',
          key: 'cert-level',
          order: 65,
          items: [
            {
              key: 'cert-level',
              label: 'Certification level',
              Component: CertificationLevelToolbarDropdown,
            },
          ],
        },
      ],
    },
  }
})
