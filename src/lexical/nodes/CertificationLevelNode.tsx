/**
 * Custom Lexical node for inline certification level tagging
 * Allows wrapping text with a certification level badge
 */

import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from 'lexical'

import { DecoratorNode } from 'lexical'
import * as React from 'react'
import { CERT_LEVELS, type CertLevelKey } from '@/lib/certificationLevels'

export type SerializedCertificationLevelNode = Spread<
  {
    certLevel: CertLevelKey
    text: string
  },
  SerializedLexicalNode
>

/**
 * CertificationLevelNode - Inline node for cert level tagging
 */
export class CertificationLevelNode extends DecoratorNode<React.JSX.Element> {
  __certLevel: CertLevelKey
  __text: string

  static getType(): string {
    return 'certification-level'
  }

  static clone(node: CertificationLevelNode): CertificationLevelNode {
    return new CertificationLevelNode(node.__certLevel, node.__text, node.__key)
  }

  constructor(certLevel: CertLevelKey, text: string, key?: NodeKey) {
    super(key)
    this.__certLevel = certLevel
    this.__text = text
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const span = document.createElement('span')
    span.className = 'cert-level-node'
    span.setAttribute('data-cert-level', this.__certLevel)
    return span
  }

  updateDOM(): false {
    return false
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('span')
    element.setAttribute('data-cert-level', this.__certLevel)
    element.textContent = this.__text
    element.className = 'cert-level-content'
    return { element }
  }

  static importDOM(): DOMConversionMap | null {
    return {
      span: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute('data-cert-level')) {
          return null
        }
        return {
          conversion: convertCertificationLevelElement,
          priority: 1,
        }
      },
    }
  }

  exportJSON(): SerializedCertificationLevelNode {
    return {
      certLevel: this.__certLevel,
      text: this.__text,
      type: 'certification-level',
      version: 1,
    }
  }

  static importJSON(serializedNode: SerializedCertificationLevelNode): CertificationLevelNode {
    const node = $createCertificationLevelNode(serializedNode.certLevel, serializedNode.text)
    return node
  }

  getCertLevel(): CertLevelKey {
    return this.__certLevel
  }

  getText(): string {
    return this.__text
  }

  setText(text: string): void {
    const writable = this.getWritable()
    writable.__text = text
  }

  setCertLevel(certLevel: CertLevelKey): void {
    const writable = this.getWritable()
    writable.__certLevel = certLevel
  }

  decorate(): React.JSX.Element {
    return <CertificationLevelComponent certLevel={this.__certLevel} text={this.__text} />
  }

  isInline(): boolean {
    return true
  }
}

/**
 * React component that renders in the editor
 */
function CertificationLevelComponent({
  certLevel,
  text,
}: {
  certLevel: CertLevelKey
  text: string
}): React.JSX.Element {
  const cert = CERT_LEVELS[certLevel]

  return (
    <span
      className="cert-level-badge"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 6px',
        borderRadius: '4px',
        backgroundColor: `${cert.color}20`,
        border: `1px solid ${cert.color}`,
        fontSize: '0.875em',
        fontWeight: 500,
        whiteSpace: 'nowrap',
      }}
      title={cert.description}
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
        }}
      >
        {cert.label}
      </span>
      <span style={{ color: '#1f2937' }}>{text}</span>
    </span>
  )
}

/**
 * Helper function to create a CertificationLevelNode
 */
export function $createCertificationLevelNode(
  certLevel: CertLevelKey,
  text: string,
): CertificationLevelNode {
  return new CertificationLevelNode(certLevel, text)
}

/**
 * Type guard to check if a node is a CertificationLevelNode
 */
export function $isCertificationLevelNode(
  node: LexicalNode | null | undefined,
): node is CertificationLevelNode {
  return node instanceof CertificationLevelNode
}

/**
 * Conversion function for importing from HTML
 */
function convertCertificationLevelElement(domNode: HTMLElement): DOMConversionOutput | null {
  const certLevel = domNode.getAttribute('data-cert-level') as CertLevelKey
  const text = domNode.textContent || ''

  if (!certLevel || !CERT_LEVELS[certLevel]) {
    return null
  }

  const node = $createCertificationLevelNode(certLevel, text)
  return { node }
}
