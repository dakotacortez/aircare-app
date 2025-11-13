/**
 * RichTextContent Component
 * Renders Lexical rich text with optional certification badge styling.
 * Applies service line filtering so only authorized content is displayed.
 */

'use client'

import React, { type ReactElement } from 'react'
import { canViewContent, CERT_LEVELS } from '@/lib/certificationLevels'
import type { SerializedCertificationLevelNode } from '@/lexical/nodes/CertificationLevelNode'
import type { SerializedCalloutBlockNode } from '@/lexical/nodes/CalloutBlockNode'
import { getCalloutIcon, getCalloutPreset, type CalloutVariant } from '@/lib/calloutPresets'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { ServiceLineType } from '@/providers/ServiceLine'
import type { CertLevelKey } from '@/lib/certificationLevels'
import type { SerializedLexicalNode } from 'lexical'

const HEADING_TAGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const

export interface RichTextSerializedNode extends SerializedLexicalNode {
  children?: RichTextSerializedNode[]
  text?: string
  format?: number | string // number for text nodes (bold, italic), string for block nodes (alignment)
  tag?: string | number
  listType?: 'number' | 'bullet' | string
  url?: string
  newTab?: boolean
}

export interface SerializedRichTextState {
  root?: RichTextSerializedNode
}

interface RichTextContentProps {
  content: SerializedRichTextState | null | undefined // Lexical JSON content
  showBadges?: boolean // Whether to show authorization badges
  serviceLine?: ServiceLineType // Active service line for filtering
}

type RenderContext = {
  showBadges: boolean
  serviceLineLevel?: number
}

const SERVICE_LINE_TO_CERT_KEY: Record<ServiceLineType, CertLevelKey> = {
  BLS: 'bls',
  ALS: 'als',
  CCT: 'cct',
}

/**
 * Main component for rendering rich text content
 */
export function RichTextContent({
  content,
  showBadges = true,
  serviceLine,
}: RichTextContentProps): ReactElement {
  if (!content || !content.root) {
    return <div className="protocol-content-empty">No content available</div>
  }

  const rootNode = content.root

  const serviceLineLevel =
    serviceLine != null ? CERT_LEVELS[SERVICE_LINE_TO_CERT_KEY[serviceLine]].level : undefined

  const context: RenderContext = {
    showBadges,
    serviceLineLevel,
  }

  return <>{renderLexicalNode(rootNode, context)}</>
}

/**
 * Render a Lexical node to React elements
 */
function renderLexicalNode(
  node: RichTextSerializedNode,
  context: RenderContext,
  key?: string,
): React.ReactNode {
  if (!node) return null

  const nodeKey = key || `node-${Math.random()}`

  // Handle certification level nodes (authorization badges)
  if (node.type === 'certification-level') {
    return renderCertificationLevelNode(node as SerializedCertificationLevelNode, context, nodeKey)
  }

  // Handle callout blocks
  if (node.type === 'callout-block') {
    return renderCalloutBlockNode(node as SerializedCalloutBlockNode, context, nodeKey)
  }

  // Handle text nodes
  if (node.type === 'text') {
    let text: React.ReactNode = node.text || ''

    // Apply text formatting - nest properly for multiple formats
    if (typeof node.format === 'number' && node.format) {
      // Apply in reverse order so outermost formatting is applied last
      if (node.format & 4) text = <s key={`${nodeKey}-strike`}>{text}</s> // Strikethrough
      if (node.format & 8) text = <u key={`${nodeKey}-underline`}>{text}</u> // Underline
      if (node.format & 2) text = <em key={`${nodeKey}-italic`}>{text}</em> // Italic
      if (node.format & 1) text = <strong key={`${nodeKey}-bold`}>{text}</strong> // Bold
    }

    return text
  }

  // Handle paragraph
  if (node.type === 'paragraph') {
    const children = renderChildNodes(node.children, context, nodeKey)
    if (children.length === 0) {
      return null
    }

    return (
      <p key={nodeKey}>
        {children}
      </p>
    )
  }

  // Handle headings
  if (node.type === 'heading') {
    const Tag = deriveHeadingTag(node.tag)
    const children = renderChildNodes(node.children, context, nodeKey)
    if (children.length === 0) {
      return null
    }

    return (
      <Tag key={nodeKey}>
        {children}
      </Tag>
    )
  }

  // Handle lists
  if (node.type === 'list') {
    const Tag = node.listType === 'number' ? 'ol' : 'ul'
    const children = renderChildNodes(node.children, context, nodeKey)
    if (children.length === 0) {
      return null
    }

    return (
      <Tag key={nodeKey}>
        {children}
      </Tag>
    )
  }

  if (node.type === 'listitem') {
    const children = renderChildNodes(node.children, context, nodeKey)
    if (children.length === 0) {
      return null
    }

    // Check if this is a checkbox list item
    const isCheckbox = typeof (node as { checked?: unknown }).checked === 'boolean'
    const isChecked = (node as { checked?: boolean }).checked ?? false

    if (isCheckbox) {
      return (
        <li key={nodeKey} className="checkbox-list-item">
          <input
            type="checkbox"
            checked={isChecked}
            disabled
            readOnly
            aria-label={isChecked ? 'Checked item' : 'Unchecked item'}
          />
          <span className="checkbox-list-item__content">
            {children}
          </span>
        </li>
      )
    }

    return (
      <li key={nodeKey}>
        {children}
      </li>
    )
  }

  // Handle links
  if (node.type === 'link') {
    const children = renderChildNodes(node.children, context, nodeKey)
    if (children.length === 0) {
      return null
    }

    return (
      <a key={nodeKey} href={node.url} target={node.newTab ? '_blank' : undefined} rel="noopener noreferrer">
        {children}
      </a>
    )
  }

  // Handle root
  if (node.type === 'root') {
    const children = renderChildNodes(node.children, context, 'root')
    if (children.length === 0) {
      return null
    }

    return (
      <>
        {children}
      </>
    )
  }

  // Fallback: render children if available
  if (node.children) {
    const children = renderChildNodes(node.children, context, nodeKey)
    if (children.length === 0) {
      return null
    }

    return (
      <>
        {children}
      </>
    )
  }

  return null
}

/**
 * Render a certification level node with badge
 * Shows Medical Control / Physician Only authorization badges
 */
function renderCertificationLevelNode(
  node: SerializedCertificationLevelNode,
  context: RenderContext,
  key: string,
): React.ReactNode {
  const certKey = node.certLevel as CertLevelKey
  const cert = CERT_LEVELS[certKey]

  if (!cert) {
    return <React.Fragment key={key}>{node.text}</React.Fragment>
  }

  if (
    typeof context.serviceLineLevel === 'number' &&
    !canViewContent(context.serviceLineLevel, cert.level)
  ) {
    return null
  }

  if (!context.showBadges) {
    // Just render the text without badge
    return <React.Fragment key={key}>{node.text}</React.Fragment>
  }

  return (
    <span
      key={key}
      className="cert-level-badge-frontend"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 8px',
        borderRadius: '4px',
        backgroundColor: `${cert.color}15`,
        border: `1px solid ${cert.color}50`,
        fontSize: '0.95em',
        fontWeight: 500,
      }}
      title={cert.label}
    >
      <span
        style={{
          display: 'inline-block',
          padding: '1px 4px',
          borderRadius: '2px',
          backgroundColor: cert.color,
          color: 'white',
          fontSize: '0.75em',
          fontWeight: 600,
          textTransform: 'uppercase',
          lineHeight: 1.2,
        }}
      >
        {cert.label}
      </span>
      <span>{node.text}</span>
    </span>
  )
}

/**
 * Get color scheme CSS variables for callout/alert
 */
function getColorScheme(color: string) {
  const colorMap: Record<string, { bg: string; border: string; text: string; header: string }> = {
    '#0ea5e9': { bg: '#e0f2fe', border: '#38bdf8', text: '#0c4a6e', header: '#38bdf8' }, // sky/blue
    '#3b82f6': { bg: '#dbeafe', border: '#60a5fa', text: '#1e3a8a', header: '#60a5fa' }, // blue
    '#f59e0b': { bg: '#fef3c7', border: '#fbbf24', text: '#78350f', header: '#fbbf24' }, // amber/yellow
    '#ef4444': { bg: '#fee2e2', border: '#f87171', text: '#7f1d1d', header: '#f87171' }, // red
    '#10b981': { bg: '#d1fae5', border: '#34d399', text: '#064e3b', header: '#34d399' }, // emerald/green
    '#f97316': { bg: '#fed7aa', border: '#fb923c', text: '#7c2d12', header: '#fb923c' }, // orange
    '#6366f1': { bg: '#e0e7ff', border: '#818cf8', text: '#312e81', header: '#818cf8' }, // indigo
  }

  return colorMap[color] || { bg: '#e0f2fe', border: '#38bdf8', text: '#0c4a6e', header: '#38bdf8' }
}

/**
 * Render a callout block node
 * Alerts: inline badges that float right
 * Callouts: corner label boxes with colored borders
 */
function renderCalloutBlockNode(
  node: SerializedCalloutBlockNode,
  context: RenderContext,
  key: string,
): React.ReactNode {
  const preset = node.presetId ? getCalloutPreset(node.presetId) : undefined
  const label = node.label || node.customLabel || preset?.label || 'Callout'
  const color = sanitizeColor(node.color || preset?.color || '#0ea5e9')
  const iconDefinition = getCalloutIcon(node.icon || preset?.icon || 'circle-info')
  const calloutChildren = (node.children ?? []) as RichTextSerializedNode[]
  const originalHasBodyContent = hasMeaningfulContent(calloutChildren)
  const rawVariant = (node.variant as CalloutVariant | undefined) ?? preset?.variant ?? 'callout'
  const variant: CalloutVariant = originalHasBodyContent ? rawVariant : 'alert'
  const isAlert = variant === 'alert'
  const renderedChildren = renderChildNodes(calloutChildren, context, key)
  const hasVisibleBody = renderedChildren.length > 0

  if (!isAlert && !hasVisibleBody) {
    return null
  }

  const colorScheme = getColorScheme(color)

  const containerStyle: React.CSSProperties & Record<string, string> = {
    '--callout-bg-color': colorScheme.bg,
    '--callout-border-color': colorScheme.border,
    '--callout-text-color': colorScheme.text,
    '--callout-header-bg': colorScheme.header,
  }

  if (isAlert) {
    // Render as inline badge
    return (
      <span key={key} className="callout-block callout-block--alert" style={containerStyle}>
        <span className="callout-block__icon">
          <FontAwesomeIcon icon={iconDefinition} />
        </span>
        <span className="callout-block__label">{label}</span>
      </span>
    )
  }

  // Render as corner label box
  return (
    <div key={key} className="callout-block" style={containerStyle}>
      <div className="callout-block__header">
        <span className="callout-block__icon">
          <FontAwesomeIcon icon={iconDefinition} />
        </span>
        <span className="callout-block__label">{label.toUpperCase()}:</span>
      </div>

      <div className="callout-block__body">
        {renderedChildren}
      </div>
    </div>
  )
}

function renderChildNodes(
  children: readonly RichTextSerializedNode[] | undefined,
  context: RenderContext,
  parentKey: string,
): React.ReactNode[] {
  if (!children) {
    return []
  }

  const rendered = children.map((child, index) =>
    renderLexicalNode(child, context, `${parentKey}-${index}`),
  )

  return filterRenderableChildren(rendered)
}

function filterRenderableChildren(nodes: React.ReactNode[]): React.ReactNode[] {
  return React.Children.toArray(nodes).filter((child) => {
    if (typeof child === 'string') {
      return child.trim().length > 0
    }

    if (Array.isArray(child)) {
      return filterRenderableChildren(child).length > 0
    }

    return child !== null && child !== undefined
  })
}

function hasMeaningfulContent(children: readonly RichTextSerializedNode[]): boolean {
  return children.some((child) => {
    if (!child) return false
    if (child.type === 'text') {
      return Boolean(child.text?.trim())
    }

    const nestedChildren = child.children
    if (nestedChildren && nestedChildren.length > 0) {
      return hasMeaningfulContent(nestedChildren)
    }

    return false
  })
}

function deriveHeadingTag(tag: RichTextSerializedNode['tag']): (typeof HEADING_TAGS)[number] {
  if (typeof tag === 'string' && HEADING_TAGS.includes(tag as (typeof HEADING_TAGS)[number])) {
    return tag as (typeof HEADING_TAGS)[number]
  }

  const numericTag = typeof tag === 'number' ? tag : Number.parseInt(String(tag ?? ''), 10)
  if (Number.isInteger(numericTag) && numericTag >= 1 && numericTag <= 6) {
    return `h${numericTag}` as (typeof HEADING_TAGS)[number]
  }

  return 'h2'
}

function sanitizeColor(color: string): string {
  if (!color) return '#0ea5e9'
  return color.startsWith('#') ? color : `#${color}`
}
