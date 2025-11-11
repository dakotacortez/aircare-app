/**
 * CalloutBlockNode - Lexical ElementNode for colored callout boxes
 * Can contain rich text children (paragraphs, lists, etc.)
 */

import {
  ElementNode,
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedElementNode,
  Spread,
  DOMConversionMap,
  DOMExportOutput,
} from 'lexical'
import type { CalloutPresetId } from '@/lib/calloutPresets'
import { getCalloutPreset } from '@/lib/calloutPresets'

export type SerializedCalloutBlockNode = Spread<
  {
    presetId: CalloutPresetId
    customLabel?: string
  },
  SerializedElementNode
>

/**
 * Callout Block Node - colored box with icon, label, and rich content
 */
export class CalloutBlockNode extends ElementNode {
  __presetId: CalloutPresetId
  __customLabel?: string

  static getType(): string {
    return 'callout-block'
  }

  static clone(node: CalloutBlockNode): CalloutBlockNode {
    return new CalloutBlockNode(node.__presetId, node.__customLabel, node.__key)
  }

  constructor(presetId: CalloutPresetId, customLabel?: string, key?: NodeKey) {
    super(key)
    this.__presetId = presetId
    this.__customLabel = customLabel
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const preset = getCalloutPreset(this.__presetId)
    if (!preset) {
      // Fallback if preset not found
      const div = document.createElement('div')
      div.className = 'callout-block'
      return div
    }

    const container = document.createElement('div')
    container.className = 'callout-block'
    container.style.backgroundColor = preset.bgColor
    container.style.borderLeft = `4px solid ${preset.borderColor}`
    container.style.borderRadius = '0.5rem'
    container.style.padding = '1rem'
    container.style.marginTop = '1rem'
    container.style.marginBottom = '1rem'
    container.setAttribute('data-preset-id', this.__presetId)

    return container
  }

  updateDOM(prevNode: CalloutBlockNode, _dom: HTMLElement, _config: EditorConfig): boolean {
    // Return true if we need to replace the DOM node
    return prevNode.__presetId !== this.__presetId
  }

  exportJSON(): SerializedCalloutBlockNode {
    return {
      ...super.exportJSON(),
      presetId: this.__presetId,
      customLabel: this.__customLabel,
      type: 'callout-block',
      version: 1,
    }
  }

  static importJSON(serializedNode: SerializedCalloutBlockNode): CalloutBlockNode {
    const node = $createCalloutBlockNode(serializedNode.presetId, serializedNode.customLabel)
    node.setFormat(serializedNode.format)
    node.setIndent(serializedNode.indent)
    node.setDirection(serializedNode.direction)
    return node
  }

  exportDOM(): DOMExportOutput {
    const element = this.createDOM({} as EditorConfig)
    return { element }
  }

  static importDOM(): DOMConversionMap | null {
    return {}
  }

  getPresetId(): CalloutPresetId {
    return this.__presetId
  }

  getCustomLabel(): string | undefined {
    return this.__customLabel
  }

  // Allow callout blocks to be block-level
  isInline(): boolean {
    return false
  }

  // Allow callout blocks at the top level
  canBeEmpty(): boolean {
    return false
  }
}

/**
 * Helper to create a CalloutBlockNode
 */
export function $createCalloutBlockNode(
  presetId: CalloutPresetId,
  customLabel?: string,
): CalloutBlockNode {
  return new CalloutBlockNode(presetId, customLabel)
}

/**
 * Type guard to check if a node is a CalloutBlockNode
 */
export function $isCalloutBlockNode(
  node: LexicalNode | null | undefined,
): node is CalloutBlockNode {
  return node instanceof CalloutBlockNode
}
