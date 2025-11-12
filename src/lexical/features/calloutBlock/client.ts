'use client'

import { createElement, type FC } from 'react'

import { createClientFeature } from '@payloadcms/richtext-lexical/client'

import { CalloutBlockNode } from '@/lexical/nodes/CalloutBlockNode'
import {
  CalloutBlockPlugin,
  CalloutBlockToolbarDropdown,
} from '../../plugins/CalloutBlockPlugin'

const CalloutBlockPluginComponent: FC<{ clientProps: undefined }> = () =>
  createElement(CalloutBlockPlugin)

export const CalloutBlockFeatureClient = createClientFeature(() => {
  return {
    nodes: [CalloutBlockNode],
    plugins: [
      {
        Component: CalloutBlockPluginComponent,
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
              Component: CalloutBlockToolbarDropdown,
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
              Component: CalloutBlockToolbarDropdown,
            },
          ],
        },
      ],
    },
  }
})
