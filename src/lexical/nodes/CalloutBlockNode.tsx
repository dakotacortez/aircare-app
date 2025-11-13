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
  SerializedLexicalNode,
  Spread,
  DOMConversionMap,
  DOMExportOutput,
} from 'lexical'
import type { CalloutIconId, CalloutPresetId, CalloutVariant } from '@/lib/calloutPresets'
import { getCalloutIcon, getCalloutPreset } from '@/lib/calloutPresets'

type CalloutSerializedFields = {
  presetId?: CalloutPresetId
  label?: string
  icon?: CalloutIconId
  color?: string
  customLabel?: string
  variant?: CalloutVariant
}

export type SerializedCalloutBlockNode = Spread<
  CalloutSerializedFields,
  SerializedElementNode
>

function applyCalloutStyles(dom: HTMLElement, color: string, variant: CalloutVariant): void {
  const isAlert = variant === 'alert'

  dom.style.setProperty('--callout-color', color)
  dom.style.setProperty('--callout-bg', hexToRgba(color, isAlert ? 0.12 : 0.1))
  dom.style.setProperty('--callout-border', hexToRgba(color, 0.32))
  dom.style.setProperty('--callout-shadow', `0 22px 48px ${hexToRgba(color, 0.18)}`)
  dom.style.setProperty('--callout-shadow-hover', `0 30px 62px ${hexToRgba(color, 0.22)}`)
  dom.style.setProperty('--callout-icon-bg', `linear-gradient(135deg, ${hexToRgba(color, 0.9)} 0%, ${hexToRgba(color, 0.75)} 100%)`)
  dom.style.setProperty('--callout-icon-color', '#ffffff')
  dom.style.setProperty('--callout-icon-shadow', `0 16px 32px ${hexToRgba(color, 0.28)}`)
  dom.style.setProperty('--callout-label-color', color)
  dom.style.setProperty('--callout-body-color', isAlert ? '#334155' : '#1f2937')
  dom.style.setProperty('--callout-padding', isAlert ? '1.1rem 1.4rem' : '1.35rem 1.6rem')
  dom.style.setProperty('--callout-bg-dark', `linear-gradient(135deg, ${hexToRgba(color, isAlert ? 0.32 : 0.26)} 0%, rgba(15, 23, 42, 0.88) 100%)`)
  dom.style.setProperty('--callout-border-dark', hexToRgba(color, 0.45))
  dom.style.setProperty('--callout-shadow-dark', '0 28px 60px rgba(8, 47, 73, 0.45)')
  dom.style.setProperty('--callout-shadow-dark-hover', '0 36px 70px rgba(8, 47, 73, 0.55)')
  dom.style.setProperty('--callout-body-color-dark', '#e2e8f0')
  dom.style.setProperty('--callout-icon-bg-dark', `linear-gradient(135deg, ${hexToRgba(color, 0.6)} 0%, ${hexToRgba(color, 0.42)} 100%)`)
  dom.style.setProperty('--callout-icon-shadow-dark', `0 16px 36px ${hexToRgba(color, 0.35)}`)
  dom.style.setProperty('--callout-label-color-dark', color)

  dom.style.padding = 'var(--callout-padding)'
  dom.style.margin = '1.25rem 0'
  dom.style.border = '1px solid var(--callout-border)'
  dom.style.background = 'var(--callout-bg)'
  dom.style.boxShadow = 'var(--callout-shadow)'
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

function renderHeader(dom: HTMLElement, icon: CalloutIconId, label: string): void {
  const existingHeader = dom.querySelector(':scope > .callout-block__header')
  if (existingHeader) {
    existingHeader.remove()
  }

  const header = document.createElement('div')
  header.className = 'callout-block__header'
  header.contentEditable = 'false'

  const iconWrapper = document.createElement('span')
  iconWrapper.className = 'callout-block__icon'

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

  header.append(iconWrapper, labelSpan)
  dom.prepend(header)
}

function hasMeaningfulSerializedChildren(children?: SerializedLexicalNode[]): boolean {
  if (!Array.isArray(children)) {
    return false
  }

  return children.some((child) => {
    if (!child) {
      return false
    }

    const text = (child as { text?: unknown }).text
    if (typeof text === 'string' && text.trim().length > 0) {
      return true
    }

    const nestedChildren = (child as { children?: SerializedLexicalNode[] }).children
    if (Array.isArray(nestedChildren)) {
      return hasMeaningfulSerializedChildren(nestedChildren)
    }

    return false
  })
}

/**
 * Callout Block Node - colored box with icon, label, and rich content
 */
export class CalloutBlockNode extends ElementNode {
  __presetId?: CalloutPresetId
  __label: string
  __icon: CalloutIconId
  __color: string
  __variant: CalloutVariant

  static getType(): string {
    return 'callout-block'
  }

  static clone(node: CalloutBlockNode): CalloutBlockNode {
    return new CalloutBlockNode(
      {
        presetId: node.__presetId,
        label: node.__label,
        icon: node.__icon,
        color: node.__color,
        variant: node.__variant,
      },
      node.__key,
    )
  }

  constructor(
    {
      presetId,
      label,
      icon,
      color,
      variant = 'callout',
    }: {
      presetId?: CalloutPresetId
      label: string
      icon: CalloutIconId
      color: string
      variant?: CalloutVariant
    },
    key?: NodeKey,
  ) {
    super(key)
    this.__presetId = presetId
    this.__label = label
    this.__icon = icon
    this.__color = color
    this.__variant = variant
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const container = document.createElement('div')
    container.className = 'callout-block'
    if (this.__variant === 'alert') {
      container.classList.add('callout-block--alert')
    }
    container.dataset.presetId = this.__presetId || ''
    container.dataset.calloutIcon = this.__icon
    container.dataset.calloutLabel = this.__label
    container.dataset.calloutVariant = this.__variant

    applyCalloutStyles(container, this.__color, this.__variant)
    renderHeader(container, this.__icon, this.__label)

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
      prevNode.__presetId !== this.__presetId ||
      prevNode.__variant !== this.__variant
    ) {
      dom.dataset.presetId = this.__presetId || ''
      dom.dataset.calloutIcon = this.__icon
      dom.dataset.calloutLabel = this.__label
      dom.dataset.calloutVariant = this.__variant
      if (this.__variant === 'alert') {
        dom.classList.add('callout-block--alert')
      } else {
        dom.classList.remove('callout-block--alert')
      }
      applyCalloutStyles(dom, this.__color, this.__variant)
      renderHeader(dom, this.__icon, this.__label)
    }

    return false
  }

  exportJSON(): SerializedCalloutBlockNode {
    const base = super.exportJSON()
    const hasContent = hasMeaningfulSerializedChildren(
      (base.children as SerializedLexicalNode[] | undefined) ?? undefined,
    )

    return {
      ...base,
      presetId: this.__presetId,
      label: this.__label,
      icon: this.__icon,
      color: this.__color,
      variant: hasContent ? this.__variant : 'alert',
      type: 'callout-block',
      version: 2,
    }
  }

  static importJSON(serializedNode: SerializedCalloutBlockNode): CalloutBlockNode {
    const hasContent = hasMeaningfulSerializedChildren(
      (serializedNode.children as SerializedLexicalNode[] | undefined) ?? undefined,
    )
    const preset = serializedNode.presetId
      ? getCalloutPreset(serializedNode.presetId)
      : undefined

    const label = serializedNode.label || serializedNode.customLabel || preset?.label || 'Callout'
    const icon = serializedNode.icon || preset?.icon || 'circle-info'
    const color = serializedNode.color || preset?.color || '#0ea5e9'
    const baseVariant = (serializedNode.variant as CalloutVariant | undefined) ?? preset?.variant
    const variant: CalloutVariant = hasContent ? baseVariant ?? 'callout' : 'alert'

    const node = $createCalloutBlockNode({
      presetId: serializedNode.presetId,
      label,
      icon,
      color,
      variant,
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

  getVariant(): CalloutVariant {
    return this.__variant
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

  setVariant(variant: CalloutVariant): void {
    const writable = this.getWritable()
    writable.__variant = variant
  }

  setPreset(presetId?: CalloutPresetId): void {
    const writable = this.getWritable()
    writable.__presetId = presetId
  }

  // Allow callout blocks to be block-level
  isInline(): boolean {
    return false
  }

  // Allow alerts to be empty (no body content), but callouts must have content
  canBeEmpty(): boolean {
    return this.__variant === 'alert'
  }

  // Don't allow selecting the callout block itself for alerts (they have no editable content)
  isIsolated(): boolean {
    return this.__variant === 'alert'
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
    variant?: CalloutVariant
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
