/**
 * OPTION A: ElementNode Implementation
 * This allows true nesting: [ALS [Medical Control: text] more text]
 */

import {
  ElementNode,
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedElementNode,
  Spread,
} from 'lexical'
import type { CertLevelKey } from '@/lib/certificationLevels'
import { CERT_LEVELS } from '@/lib/certificationLevels'

export type SerializedCertificationLevelNode = Spread<
  {
    certLevel: CertLevelKey
  },
  SerializedElementNode
>

/**
 * ElementNode that can contain other nodes as children
 * This enables nesting: ALS tags can contain Medical Control tags
 */
export class CertificationLevelElementNode extends ElementNode {
  __certLevel: CertLevelKey

  static getType(): string {
    return 'certification-level'
  }

  static clone(node: CertificationLevelElementNode): CertificationLevelElementNode {
    return new CertificationLevelElementNode(node.__certLevel, node.__key)
  }

  constructor(certLevel: CertLevelKey, key?: NodeKey) {
    super(key)
    this.__certLevel = certLevel
  }

  createDOM(config: EditorConfig): HTMLElement {
    const span = document.createElement('span')
    const certData = CERT_LEVELS[this.__certLevel]

    span.className = 'cert-level-wrapper'
    span.style.backgroundColor = `${certData.color}20` // 20% opacity
    span.style.borderLeft = `3px solid ${certData.color}`
    span.style.paddingLeft = '4px'
    span.style.paddingRight = '4px'
    span.style.display = 'inline'
    span.setAttribute('data-cert-level', this.__certLevel)

    return span
  }

  updateDOM(
    _prevNode: CertificationLevelElementNode,
    _dom: HTMLElement,
    _config: EditorConfig,
  ): boolean {
    return false
  }

  // Critical: ElementNode can have inline children
  isInline(): boolean {
    return true
  }

  exportJSON(): SerializedCertificationLevelNode {
    return {
      ...super.exportJSON(),
      certLevel: this.__certLevel,
      type: 'certification-level',
      version: 1,
    }
  }

  static importJSON(serializedNode: SerializedCertificationLevelNode): CertificationLevelElementNode {
    const node = $createCertificationLevelElementNode(serializedNode.certLevel)
    node.setFormat(serializedNode.format)
    node.setIndent(serializedNode.indent)
    node.setDirection(serializedNode.direction)
    return node
  }

  getCertLevel(): CertLevelKey {
    return this.__certLevel
  }
}

export function $createCertificationLevelElementNode(
  certLevel: CertLevelKey,
): CertificationLevelElementNode {
  return new CertificationLevelElementNode(certLevel)
}

export function $isCertificationLevelElementNode(
  node: LexicalNode | null | undefined,
): node is CertificationLevelElementNode {
  return node instanceof CertificationLevelElementNode
}

/**
 * USAGE IN PLUGIN - How to wrap selection with ElementNode
 */
export function wrapSelectionWithCertLevel(editor: LexicalEditor, certLevel: CertLevelKey) {
  editor.update(() => {
    const selection = $getSelection()
    if ($isRangeSelection(selection)) {
      // Create the wrapper node
      const certLevelNode = $createCertificationLevelElementNode(certLevel)

      // Extract the selected nodes
      const nodes = selection.extract()

      // Add each node as a child of the wrapper
      nodes.forEach((node) => {
        certLevelNode.append(node)
      })

      // Insert the wrapper node
      selection.insertNodes([certLevelNode])
    }
  })
}

/**
 * RENDERING ON FRONTEND - Recursive rendering with nesting support
 */
export function renderElementNode(node: any, userLevel: number): React.ReactNode {
  if (node.type === 'certification-level') {
    const certData = CERT_LEVELS[node.certLevel as CertLevelKey]
    const canView = canViewContent(userLevel, certData.level)

    if (!canView) return null // Hidden content

    // Recursively render children (supports nesting!)
    const children = node.children
      ?.map((child: any) => renderElementNode(child, userLevel))
      .filter(Boolean)

    // For callouts, show badge at start
    if (certData.isCallout) {
      return (
        <span
          key={node.key}
          className="cert-level-inline-wrapper"
          style={{
            backgroundColor: `${certData.color}15`,
            borderLeft: `2px solid ${certData.color}`,
            paddingLeft: '6px',
            paddingRight: '6px',
          }}
        >
          <span
            className="cert-level-badge-frontend"
            style={{
              backgroundColor: certData.color,
              color: 'white',
            }}
          >
            {certData.label}
          </span>
          {children}
        </span>
      )
    }

    // For hierarchical levels, show subtle badge
    return (
      <span
        key={node.key}
        className="cert-level-inline-wrapper"
        style={{
          backgroundColor: `${certData.color}10`,
          borderLeft: `2px solid ${certData.color}`,
          paddingLeft: '4px',
        }}
      >
        <span className="cert-badge-small" style={{ color: certData.color }}>
          [{certData.label}]
        </span>
        {children}
      </span>
    )
  }

  // Handle text nodes, other elements, etc.
  return null
}

/**
 * EXAMPLE USAGE:
 *
 * User types: "Give aspirin"
 * User selects "aspirin" and clicks ALS button
 * User then selects text inside ALS tag and clicks Medical Control
 *
 * Result JSON:
 * {
 *   type: 'paragraph',
 *   children: [
 *     { type: 'text', text: 'Give ' },
 *     {
 *       type: 'certification-level',
 *       certLevel: 'als',
 *       children: [
 *         {
 *           type: 'certification-level',
 *           certLevel: 'medicalControl',
 *           children: [
 *             { type: 'text', text: 'aspirin' }
 *           ]
 *         }
 *       ]
 *     }
 *   ]
 * }
 *
 * Visual result: Give [ALS [Medical Control: aspirin]]
 */
