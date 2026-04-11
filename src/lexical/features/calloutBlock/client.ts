'use client'

import { createElement, type FC } from 'react'

import { createClientFeature } from '@payloadcms/richtext-lexical/client'

import { CalloutBlockNode } from '@/lexical/nodes/CalloutBlockNode'
import {
  AlertToolbarDropdown,
  CalloutBlockPlugin,
  CalloutBlockToolbarDropdown,
} from '../../plugins/CalloutBlockPlugin'

const CalloutBlockPluginComponent: FC = () =>
  createElement(CalloutBlockPlugin)

// @ts-expect-error – Payload 3.82.1 CreateClientFeatureArgs causes excessive TS stack depth; correct at runtime
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
          type: 'buttons',
          key: 'callout-alert',
          order: 60,
          items: [
            {
              key: 'alert-block',
              label: 'Insert alert',
              Component: AlertToolbarDropdown,
            },
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
          type: 'buttons',
          key: 'callout-alert',
          order: 60,
          items: [
            {
              key: 'alert-block',
              label: 'Insert alert',
              Component: AlertToolbarDropdown,
            },
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
