/**
 * RichTextContent Component
 * Renders Lexical rich text with certification level filtering
 * Hierarchical: CCT sees all content, ALS sees ALS+Basic, etc.
 */

'use client'

import React, { useMemo } from 'react'
import { CERT_LEVELS, canViewContent, type CertLevelKey } from '@/lib/certificationLevels'
import type { SerializedCertificationLevelNode } from '@/lexical/nodes/CertificationLevelNode'

interface RichTextContentProps {
  content: any // Lexical JSON content
  userCertLevel?: number // User's certification level (0-5), defaults to showing all
  showBadges?: boolean // Whether to show cert level badges on frontend
}

/**
 * Main component for rendering filtered rich text content
 */
export function RichTextContent({
  content,
  userCertLevel = 5, // Default: show all content (physician level)
  showBadges = true,
}: RichTextContentProps): JSX.Element {
  const filteredContent = useMemo(() => {
    if (!content || !content.root) return null
    return filterContentByLevel(content.root, userCertLevel)
  }, [content, userCertLevel])

  if (!filteredContent) {
    return <div className="protocol-content-empty">No content available</div>
  }

  return <>{renderLexicalNode(filteredContent, userCertLevel, showBadges)}</>
}

/**
 * Recursively filter Lexical JSON tree based on user cert level
 */
function filterContentByLevel(node: any, userLevel: number): any {
  // If this is a certification-level node, check if user can see it
  if (node.type === 'certification-level') {
    const contentLevel = CERT_LEVELS[node.certLevel as CertLevelKey]?.level ?? 0
    const canView = canViewContent(userLevel, contentLevel)

    // If user can't view, return null to hide this node
    if (!canView) {
      return null
    }

    // User can view - return the node as-is
    return node
  }

  // For other nodes, recursively filter children
  if (node.children && Array.isArray(node.children)) {
    const filteredChildren = node.children
      .map((child: any) => filterContentByLevel(child, userLevel))
      .filter((child: any) => child !== null)

    // If all children were filtered out, hide the parent node too
    if (filteredChildren.length === 0 && node.children.length > 0) {
      return null
    }

    return {
      ...node,
      children: filteredChildren,
    }
  }

  return node
}

/**
 * Render a Lexical node to React elements
 */
function renderLexicalNode(
  node: any,
  userLevel: number,
  showBadges: boolean,
  key?: string,
): React.ReactNode {
  if (!node) return null

  const nodeKey = key || `node-${Math.random()}`

  // Handle certification level nodes
  if (node.type === 'certification-level') {
    return renderCertificationLevelNode(node as SerializedCertificationLevelNode, showBadges, nodeKey)
  }

  // Handle text nodes
  if (node.type === 'text') {
    let text = node.text || ''

    // Apply text formatting
    if (node.format) {
      if (node.format & 1) text = <strong key={nodeKey}>{text}</strong> // Bold
      if (node.format & 2) text = <em key={nodeKey}>{text}</em> // Italic
      if (node.format & 8) text = <u key={nodeKey}>{text}</u> // Underline
      if (node.format & 4) text = <s key={nodeKey}>{text}</s> // Strikethrough
    }

    return text
  }

  // Handle paragraph
  if (node.type === 'paragraph') {
    return (
      <p key={nodeKey}>
        {node.children?.map((child: any, i: number) =>
          renderLexicalNode(child, userLevel, showBadges, `${nodeKey}-${i}`),
        )}
      </p>
    )
  }

  // Handle headings
  if (node.type === 'heading') {
    const Tag = `h${node.tag}` as keyof JSX.IntrinsicElements
    return (
      <Tag key={nodeKey}>
        {node.children?.map((child: any, i: number) =>
          renderLexicalNode(child, userLevel, showBadges, `${nodeKey}-${i}`),
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
          renderLexicalNode(child, userLevel, showBadges, `${nodeKey}-${i}`),
        )}
      </Tag>
    )
  }

  if (node.type === 'listitem') {
    return (
      <li key={nodeKey}>
        {node.children?.map((child: any, i: number) =>
          renderLexicalNode(child, userLevel, showBadges, `${nodeKey}-${i}`),
        )}
      </li>
    )
  }

  // Handle links
  if (node.type === 'link') {
    return (
      <a key={nodeKey} href={node.url} target={node.newTab ? '_blank' : undefined} rel="noopener noreferrer">
        {node.children?.map((child: any, i: number) =>
          renderLexicalNode(child, userLevel, showBadges, `${nodeKey}-${i}`),
        )}
      </a>
    )
  }

  // Handle root
  if (node.type === 'root') {
    return (
      <>
        {node.children?.map((child: any, i: number) =>
          renderLexicalNode(child, userLevel, showBadges, `root-${i}`),
        )}
      </>
    )
  }

  // Fallback: render children if available
  if (node.children) {
    return (
      <>
        {node.children.map((child: any, i: number) =>
          renderLexicalNode(child, userLevel, showBadges, `${nodeKey}-${i}`),
        )}
      </>
    )
  }

  return null
}

/**
 * Render a certification level node with badge
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
      title={`${cert.label}: ${cert.description}`}
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
 * Hook to get current user's certification level
 * TODO: Integrate with your auth system
 */
export function useCertificationLevel(): number {
  // TODO: Get from user session/auth context
  // For now, return highest level (show all content)
  // In production, this should check user.certLevel from session
  return 5 // Physician level (sees all)
}
