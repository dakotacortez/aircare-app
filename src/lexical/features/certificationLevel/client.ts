'use client'

import { createElement, type FC } from 'react'

import { createClientFeature } from '@payloadcms/richtext-lexical/client'

import { CertificationLevelNode } from '@/lexical/nodes/CertificationLevelNode'
import {
  CertificationLevelPlugin,
  CertificationLevelToolbarDropdown,
} from '../../plugins/CertificationLevelPlugin'

const CertificationLevelPluginComponent: FC = () =>
  createElement(CertificationLevelPlugin)

// @ts-expect-error – Payload 3.82.1 CreateClientFeatureArgs causes excessive TS stack depth; correct at runtime
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
