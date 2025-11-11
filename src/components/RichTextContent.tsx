/**
 * RichTextContent Component
 * Renders Lexical rich text with authorization badges (Medical Control, Physician Only)
 * No filtering - content visibility is controlled by service line zones
 */

'use client'

import React, { type ReactElement } from 'react'
import { CERT_LEVELS } from '@/lib/certificationLevels'
import type { SerializedCertificationLevelNode } from '@/lexical/nodes/CertificationLevelNode'
import type { SerializedCalloutBlockNode } from '@/lexical/nodes/CalloutBlockNode'
import { getCalloutPreset } from '@/lib/calloutPresets'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

interface RichTextContentProps {
  content: any // Lexical JSON content
  showBadges?: boolean // Whether to show authorization badges
}

/**
 * Main component for rendering rich text content
 */
export function RichTextContent({
  content,
  showBadges = true,
}: RichTextContentProps): ReactElement {
  if (!content || !content.root) {
    return <div className="protocol-content-empty">No content available</div>
  }

  return <>{renderLexicalNode(content.root, showBadges)}</>
}

/**
 * Render a Lexical node to React elements
 */
function renderLexicalNode(
  node: any,
  showBadges: boolean,
  key?: string,
): React.ReactNode {
  if (!node) return null

  const nodeKey = key || `node-${Math.random()}`

  // Handle certification level nodes (authorization badges)
  if (node.type === 'certification-level') {
    return renderCertificationLevelNode(node as SerializedCertificationLevelNode, showBadges, nodeKey)
  }

  // Handle callout blocks
  if (node.type === 'callout-block') {
    return renderCalloutBlockNode(node as SerializedCalloutBlockNode, showBadges, nodeKey)
  }

  // Handle text nodes
  if (node.type === 'text') {
    let text: React.ReactNode = node.text || ''

    // Apply text formatting - nest properly for multiple formats
    if (node.format) {
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
    return (
      <p key={nodeKey}>
        {node.children?.map((child: any, i: number) =>
          renderLexicalNode(child, showBadges, `${nodeKey}-${i}`),
        )}
      </p>
    )
  }

  // Handle headings
  if (node.type === 'heading') {
    const Tag = `h${node.tag}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
    return (
      <Tag key={nodeKey}>
        {node.children?.map((child: any, i: number) =>
          renderLexicalNode(child, showBadges, `${nodeKey}-${i}`),
        )}
      </Tag>
    )
  }

  // Handle lists
  if (node.type === 'list') {
    const Tag = node.listType === 'number' ? 'ol' : 'ul'
    return (
      <Tag key={nodeKey}>
        {node.children?.map((child: any, i: number) =>
          renderLexicalNode(child, showBadges, `${nodeKey}-${i}`),
        )}
      </Tag>
    )
  }

  if (node.type === 'listitem') {
    return (
      <li key={nodeKey}>
        {node.children?.map((child: any, i: number) =>
          renderLexicalNode(child, showBadges, `${nodeKey}-${i}`),
        )}
      </li>
    )
  }

  // Handle links
  if (node.type === 'link') {
    return (
      <a key={nodeKey} href={node.url} target={node.newTab ? '_blank' : undefined} rel="noopener noreferrer">
        {node.children?.map((child: any, i: number) =>
          renderLexicalNode(child, showBadges, `${nodeKey}-${i}`),
        )}
      </a>
    )
  }

  // Handle root
  if (node.type === 'root') {
    return (
      <>
        {node.children?.map((child: any, i: number) =>
          renderLexicalNode(child, showBadges, `root-${i}`),
        )}
      </>
    )
  }

  // Fallback: render children if available
  if (node.children) {
    return (
      <>
        {node.children.map((child: any, i: number) =>
          renderLexicalNode(child, showBadges, `${nodeKey}-${i}`),
        )}
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
  showBadges: boolean,
  key: string,
): React.ReactNode {
  const cert = CERT_LEVELS[node.certLevel]

  if (!showBadges) {
    // Just render the text without badge
    return <span key={key}>{node.text}</span>
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
 * Render a callout block node
 * Shows colored box with icon, label, and rich content
 */
function renderCalloutBlockNode(
  node: SerializedCalloutBlockNode,
  showBadges: boolean,
  key: string,
): React.ReactNode {
  const preset = getCalloutPreset(node.presetId)

  if (!preset) {
    // Fallback if preset not found
    return (
      <div key={key} className="callout-block callout-fallback">
        {node.children?.map((child: any, i: number) =>
          renderLexicalNode(child, showBadges, `${key}-${i}`),
        )}
      </div>
    )
  }

  const label = node.customLabel || preset.label

  return (
    <div
      key={key}
      className="callout-block"
      style={{
        backgroundColor: preset.bgColor,
        borderLeft: `4px solid ${preset.borderColor}`,
        borderRadius: '0.75rem',
        padding: '1rem',
        marginTop: '1rem',
        marginBottom: '1rem',
      }}
    >
      {/* Header with icon and label */}
      <div
        className="callout-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '0.75rem',
          fontWeight: 600,
          fontSize: '0.95rem',
          color: preset.color,
        }}
      >
        <FontAwesomeIcon
          icon={preset.icon}
          style={{
            width: '1.25rem',
            height: '1.25rem',
          }}
        />
        <span>{label}</span>
      </div>

      {/* Content */}
      <div className="callout-content">
        {node.children?.map((child: any, i: number) =>
          renderLexicalNode(child, showBadges, `${key}-${i}`),
        )}
      </div>
    </div>
  )
}
