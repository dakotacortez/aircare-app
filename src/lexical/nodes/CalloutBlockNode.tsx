/**
 * CalloutBlockNode - Lexical ElementNode for colored callout boxes
 * Can contain rich text children (paragraphs, lists, etc.)
 */

import { icon as faIconFactory } from '@fortawesome/fontawesome-svg-core'
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
import type { CalloutIconId, CalloutPresetId } from '@/lib/calloutPresets'
import { getCalloutIcon, getCalloutPreset } from '@/lib/calloutPresets'

type CalloutSerializedFields = {
  presetId?: CalloutPresetId
  label?: string
  icon?: CalloutIconId
  color?: string
  customLabel?: string
}

export type SerializedCalloutBlockNode = Spread<
  CalloutSerializedFields,
  SerializedElementNode
>

function applyCalloutStyles(dom: HTMLElement, color: string): void {
  dom.style.setProperty('--callout-color', color)
  dom.style.setProperty('border-left-color', color)
  dom.style.setProperty('background-color', hexToRgba(color, 0.12))
}

function hexToRgba(hex: string, alpha: number): string {
  const sanitized = hex.replace('#', '')
  if (sanitized.length !== 6) {
    return `rgba(0, 0, 0, ${alpha})`
  }

  const r = parseInt(sanitized.substring(0, 2), 16)
  const g = parseInt(sanitized.substring(2, 4), 16)
  const b = parseInt(sanitized.substring(4, 6), 16)

  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function renderHeader(dom: HTMLElement, icon: CalloutIconId, label: string, color: string): void {
  const existingHeader = dom.querySelector(':scope > .callout-block__header')
  if (existingHeader) {
    existingHeader.remove()
  }

  const header = document.createElement('div')
  header.className = 'callout-block__header'
  header.contentEditable = 'false'
  header.style.display = 'flex'
  header.style.alignItems = 'center'
  header.style.gap = '0.75rem'
  header.style.color = color

  const iconWrapper = document.createElement('span')
  iconWrapper.className = 'callout-block__icon'
  iconWrapper.style.display = 'inline-flex'
  iconWrapper.style.alignItems = 'center'
  iconWrapper.style.justifyContent = 'center'
  iconWrapper.style.width = '2.5rem'
  iconWrapper.style.height = '2.5rem'
  iconWrapper.style.borderRadius = '0.8rem'
  iconWrapper.style.backgroundColor = color
  iconWrapper.style.color = '#fff'
  iconWrapper.style.fontSize = '1.1rem'

  try {
    const definition = getCalloutIcon(icon)
    const rendered = faIconFactory(definition)
    if (rendered?.node?.[0]) {
      const svg = rendered.node[0] as SVGElement
      svg.setAttribute('aria-hidden', 'true')
      iconWrapper.append(svg)
    }
  } catch (error) {
    console.error('Unable to render callout icon', error)
    iconWrapper.textContent = '•'
  }

  const labelSpan = document.createElement('span')
  labelSpan.className = 'callout-block__label'
  labelSpan.textContent = label
  labelSpan.style.fontWeight = '700'
  labelSpan.style.fontSize = '1rem'
  labelSpan.style.color = color

  header.append(iconWrapper, labelSpan)
  dom.prepend(header)
}

/**
 * Callout Block Node - colored box with icon, label, and rich content
 */
export class CalloutBlockNode extends ElementNode {
  __presetId?: CalloutPresetId
  __label: string
  __icon: CalloutIconId
  __color: string

  static getType(): string {
    return 'callout-block'
  }

  static clone(node: CalloutBlockNode): CalloutBlockNode {
    return new CalloutBlockNode(
      { presetId: node.__presetId, label: node.__label, icon: node.__icon, color: node.__color },
      node.__key,
    )
  }

  constructor(
    {
      presetId,
      label,
      icon,
      color,
    }: {
      presetId?: CalloutPresetId
      label: string
      icon: CalloutIconId
      color: string
    },
    key?: NodeKey,
  ) {
    super(key)
    this.__presetId = presetId
    this.__label = label
    this.__icon = icon
    this.__color = color
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const container = document.createElement('div')
    container.className = 'callout-block'
    container.style.borderLeft = '4px solid var(--callout-color)'
    container.style.borderRadius = '0.75rem'
    container.style.padding = '1rem'
    container.style.marginTop = '1rem'
    container.style.marginBottom = '1rem'
    container.dataset.presetId = this.__presetId || ''
    container.dataset.calloutIcon = this.__icon
    container.dataset.calloutLabel = this.__label

    applyCalloutStyles(container, this.__color)
    renderHeader(container, this.__icon, this.__label, this.__color)

    return container
  }

  updateDOM(prevNode: CalloutBlockNode, dom: HTMLElement, _config: EditorConfig): boolean {
    if (!(dom instanceof HTMLElement)) {
      return true
    }

    if (
      prevNode.__label !== this.__label ||
      prevNode.__icon !== this.__icon ||
      prevNode.__color !== this.__color ||
      prevNode.__presetId !== this.__presetId
    ) {
      dom.dataset.presetId = this.__presetId || ''
      dom.dataset.calloutIcon = this.__icon
      dom.dataset.calloutLabel = this.__label
      applyCalloutStyles(dom, this.__color)
      renderHeader(dom, this.__icon, this.__label, this.__color)
    }

    return false
  }

  exportJSON(): SerializedCalloutBlockNode {
    return {
      ...super.exportJSON(),
      presetId: this.__presetId,
      label: this.__label,
      icon: this.__icon,
      color: this.__color,
      type: 'callout-block',
      version: 1,
    }
  }

  static importJSON(serializedNode: SerializedCalloutBlockNode): CalloutBlockNode {
    const preset = serializedNode.presetId
      ? getCalloutPreset(serializedNode.presetId)
      : undefined

    const label = serializedNode.label || serializedNode.customLabel || preset?.label || 'Callout'
    const icon = serializedNode.icon || preset?.icon || 'circle-info'
    const color = serializedNode.color || preset?.color || '#0ea5e9'

    const node = $createCalloutBlockNode({
      presetId: serializedNode.presetId,
      label,
      icon,
      color,
    })
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

  getPresetId(): CalloutPresetId | undefined {
    return this.__presetId
  }

  getLabel(): string {
    return this.__label
  }

  getIcon(): CalloutIconId {
    return this.__icon
  }

  getColor(): string {
    return this.__color
  }

  setLabel(label: string): void {
    const writable = this.getWritable()
    writable.__label = label
  }

  setIcon(icon: CalloutIconId): void {
    const writable = this.getWritable()
    writable.__icon = icon
  }

  setColor(color: string): void {
    const writable = this.getWritable()
    writable.__color = color
  }

  setPreset(presetId?: CalloutPresetId): void {
    const writable = this.getWritable()
    writable.__presetId = presetId
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
  options: {
    presetId?: CalloutPresetId
    label: string
    icon: CalloutIconId
    color: string
  },
): CalloutBlockNode {
  return new CalloutBlockNode(options)
}

/**
 * Type guard to check if a node is a CalloutBlockNode
 */
export function $isCalloutBlockNode(
  node: LexicalNode | null | undefined,
): node is CalloutBlockNode {
  return node instanceof CalloutBlockNode
}
