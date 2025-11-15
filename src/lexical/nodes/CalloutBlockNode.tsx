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

function getColorScheme(
  color: string,
): { bg: string; border: string; text: string; header: string; headerText: string } {
  const colorMap: Record<
    string,
    { bg: string; border: string; text: string; header: string; headerText: string }
  > = {
    '#0ea5e9': { bg: '#e0f2fe', border: '#38bdf8', text: '#0c4a6e', header: '#38bdf8', headerText: '#0c4a6e' }, // sky/blue
    '#3b82f6': { bg: '#dbeafe', border: '#60a5fa', text: '#1e3a8a', header: '#60a5fa', headerText: '#1e3a8a' }, // blue
    '#f59e0b': { bg: '#fef3c7', border: '#fbbf24', text: '#78350f', header: '#fbbf24', headerText: '#78350f' }, // amber/yellow
    '#ef4444': { bg: '#fee2e2', border: '#f87171', text: '#7f1d1d', header: '#f87171', headerText: '#7f1d1d' }, // red
    '#10b981': { bg: '#d1fae5', border: '#34d399', text: '#064e3b', header: '#34d399', headerText: '#064e3b' }, // emerald/green
    '#f97316': { bg: '#fed7aa', border: '#fb923c', text: '#7c2d12', header: '#fb923c', headerText: '#7c2d12' }, // orange
    '#6366f1': { bg: '#e0e7ff', border: '#818cf8', text: '#312e81', header: '#818cf8', headerText: '#312e81' }, // indigo
  }

  return (
    colorMap[color] || {
      bg: '#e0f2fe',
      border: '#38bdf8',
      text: '#0c4a6e',
      header: '#38bdf8',
      headerText: '#0c4a6e',
    }
  )
}

function applyCalloutStyles(dom: HTMLElement, color: string, variant: CalloutVariant): void {
  const colorScheme = getColorScheme(color)

  dom.style.setProperty('--callout-bg-color', colorScheme.bg)
  dom.style.setProperty('--callout-border-color', colorScheme.border)
  dom.style.setProperty('--callout-text-color', colorScheme.text)
  dom.style.setProperty('--callout-header-bg', colorScheme.header)
  dom.style.setProperty('--callout-header-text', colorScheme.headerText)

  if (variant === 'alert') {
    dom.classList.add('callout-block--alert')
  } else {
    dom.classList.remove('callout-block--alert')
  }
}

function renderHeader(
  dom: HTMLElement,
  icon: CalloutIconId,
  label: string,
  variant: CalloutVariant,
): void {
  const existingHeader = dom.querySelector(':scope > .callout-block__header')
  const existingIcon = dom.querySelector(':scope > .callout-block__icon')
  const existingLabel = dom.querySelector(':scope > .callout-block__label')

  if (existingHeader) {
    existingHeader.remove()
  }
  if (existingIcon) {
    existingIcon.remove()
  }
  if (existingLabel) {
    existingLabel.remove()
  }

  if (variant === 'alert') {
    // For alerts, render icon and label as direct children (not in header)
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

    // Add delete button for alerts
    const deleteButton = document.createElement('button')
    deleteButton.className = 'callout-block__delete'
    deleteButton.textContent = '×'
    deleteButton.setAttribute('aria-label', 'Delete alert')
    deleteButton.setAttribute('type', 'button')
    deleteButton.contentEditable = 'false'

    iconWrapper.contentEditable = 'false'
    labelSpan.contentEditable = 'false'

    dom.append(iconWrapper, labelSpan, deleteButton)
  } else {
    // For callouts, render as header (corner label design)
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
    container.dataset.lexicalNodeKey = this.__key

    applyCalloutStyles(container, this.__color, this.__variant)
    renderHeader(container, this.__icon, this.__label, this.__variant)

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
      renderHeader(dom, this.__icon, this.__label, this.__variant)
    }

    return false
  }

  exportJSON(): SerializedCalloutBlockNode {
    const base = super.exportJSON()

    return {
      ...base,
      presetId: this.__presetId,
      label: this.__label,
      icon: this.__icon,
      color: this.__color,
      variant: this.__variant,
      type: 'callout-block',
      version: 2,
    }
  }

  static importJSON(serializedNode: SerializedCalloutBlockNode): CalloutBlockNode {
    const preset = serializedNode.presetId
      ? getCalloutPreset(serializedNode.presetId)
      : undefined

    const label = serializedNode.label || serializedNode.customLabel || preset?.label || 'Callout'
    const icon = serializedNode.icon || preset?.icon || 'circle-info'
    const color = serializedNode.color || preset?.color || '#0ea5e9'
    const variant = (serializedNode.variant as CalloutVariant | undefined) ?? preset?.variant ?? 'callout'

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
