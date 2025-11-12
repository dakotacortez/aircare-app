import type { FieldHook } from 'payload'

type LexicalNodeJSON = {
  type: string
  version?: number
  children?: LexicalNodeJSON[]
  [key: string]: unknown
}

type SanitizeResult = {
  node: LexicalNodeJSON | null
  changed: boolean
}

const ALLOWED_NODE_TYPES = new Set<string>([
  'root',
  'text',
  'paragraph',
  'linebreak',
  'heading',
  'quote',
  'list',
  'listitem',
  'horizontalrule',
  'link',
  'autolink',
  'callout-block',
  'certification-level',
])

const INLINE_NODE_TYPES = new Set<string>(['text', 'linebreak', 'link', 'autolink', 'certification-level'])

const HEADING_TAGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])

function extractPlainText(node: unknown): string {
  if (node == null || typeof node !== 'object') {
    return ''
  }

  if (typeof (node as { text?: unknown }).text === 'string') {
    return (node as { text: string }).text
  }

  const children = (node as { children?: unknown }).children
  if (Array.isArray(children)) {
    return children
      .map((child) => extractPlainText(child))
      .filter(Boolean)
      .join(' ')
  }

  return ''
}

function createTextNode(text: string, version = 1): LexicalNodeJSON {
  return {
    type: 'text',
    version,
    detail: 0,
    format: 0,
    mode: 'normal',
    style: '',
    text,
  }
}

function createParagraphNode(
  children: LexicalNodeJSON[],
  version: number,
  original?: Record<string, unknown>,
): LexicalNodeJSON {
  return {
    type: 'paragraph',
    version: typeof original?.version === 'number' ? (original.version as number) : version,
    format: typeof original?.format === 'string' ? (original.format as string) : '',
    indent: typeof original?.indent === 'number' ? (original.indent as number) : 0,
    direction: typeof original?.direction === 'string' ? (original.direction as string) : 'ltr',
    children,
  }
}

function createListItemNode(
  children: LexicalNodeJSON[],
  version: number,
  original?: Record<string, unknown>,
): LexicalNodeJSON {
  const listItem: LexicalNodeJSON = {
    type: 'listitem',
    version: typeof original?.version === 'number' ? (original.version as number) : version,
    format: typeof original?.format === 'string' ? (original.format as string) : '',
    indent: typeof original?.indent === 'number' ? (original.indent as number) : 0,
    direction: typeof original?.direction === 'string' ? (original.direction as string) : 'ltr',
    children,
  }

  if (typeof original?.value === 'number') {
    listItem.value = original.value
  }

  if (typeof original?.checked === 'boolean') {
    listItem.checked = original.checked
  }

  return listItem
}

function buildInlineChildren(children: LexicalNodeJSON[], version: number): LexicalNodeJSON[] {
  const result: LexicalNodeJSON[] = []

  for (const child of children) {
    if (INLINE_NODE_TYPES.has(child.type)) {
      result.push(child)
      continue
    }

    if ((child.type === 'paragraph' || child.type === 'root' || child.type === 'listitem') && Array.isArray(child.children)) {
      result.push(...buildInlineChildren(child.children, version))
      continue
    }

    const text = extractPlainText(child)
    if (text) {
      result.push(createTextNode(text, version))
    }
  }

  return result
}

function sanitizeNode(node: unknown, parentType: string, unknownTypes: Set<string>): SanitizeResult {
  if (node == null || typeof node !== 'object') {
    return { node: null, changed: true }
  }

  const typedNode = node as Record<string, unknown>
  const type = typeof typedNode.type === 'string' ? (typedNode.type as string) : ''
  const version = typeof typedNode.version === 'number' ? (typedNode.version as number) : 1

  let changed = false
  const sanitizedChildren: LexicalNodeJSON[] = []

  if (Array.isArray(typedNode.children)) {
    for (const child of typedNode.children) {
      const { node: sanitizedChild, changed: childChanged } = sanitizeNode(child, type || parentType, unknownTypes)
      if (childChanged) {
        changed = true
      }
      if (sanitizedChild) {
        sanitizedChildren.push(sanitizedChild)
      } else if (sanitizedChild === null) {
        changed = true
      }
    }

    if (sanitizedChildren.length !== typedNode.children.length) {
      changed = true
    }
  }

  if (type === 'root') {
    const sanitizedRoot: LexicalNodeJSON = {
      type: 'root',
      version,
      format: typeof typedNode.format === 'string' ? (typedNode.format as string) : '',
      indent: typeof typedNode.indent === 'number' ? (typedNode.indent as number) : 0,
      direction: typeof typedNode.direction === 'string' ? (typedNode.direction as string) : 'ltr',
      children: sanitizedChildren,
    }

    if (
      sanitizedRoot.format !== typedNode.format ||
      sanitizedRoot.indent !== typedNode.indent ||
      sanitizedRoot.direction !== typedNode.direction
    ) {
      changed = true
    }

    return { node: sanitizedRoot, changed }
  }

  if (type === 'text') {
    const sanitizedText: LexicalNodeJSON = {
      type: 'text',
      version,
      text: typeof typedNode.text === 'string' ? (typedNode.text as string) : '',
      detail: typeof typedNode.detail === 'number' ? (typedNode.detail as number) : 0,
      format: typeof typedNode.format === 'number' ? (typedNode.format as number) : 0,
      mode: typeof typedNode.mode === 'string' ? (typedNode.mode as string) : 'normal',
      style: typeof typedNode.style === 'string' ? (typedNode.style as string) : '',
    }

    if (
      sanitizedText.text !== typedNode.text ||
      sanitizedText.detail !== typedNode.detail ||
      sanitizedText.format !== typedNode.format ||
      sanitizedText.mode !== typedNode.mode ||
      sanitizedText.style !== typedNode.style
    ) {
      changed = true
    }

    if (Array.isArray(typedNode.children) && typedNode.children.length > 0) {
      changed = true
    }

    return { node: sanitizedText, changed }
  }

  if (type === 'listitem' && parentType !== 'list') {
    const inlineChildren = buildInlineChildren(sanitizedChildren, version)
    if (inlineChildren.length === 0) {
      return { node: null, changed: true }
    }

    return {
      node: createParagraphNode(inlineChildren, version, typedNode),
      changed: true,
    }
  }

  if (ALLOWED_NODE_TYPES.has(type)) {
    const sanitizedNode: LexicalNodeJSON = { ...typedNode } as LexicalNodeJSON

    if (sanitizedChildren.length > 0) {
      sanitizedNode.children = sanitizedChildren
    } else if ('children' in sanitizedNode) {
      delete sanitizedNode.children
    }

    if (type === 'heading') {
      sanitizedNode.tag =
        typeof typedNode.tag === 'string' && HEADING_TAGS.has(typedNode.tag as string)
          ? (typedNode.tag as string)
          : 'h2'

      if (sanitizedNode.tag !== typedNode.tag) {
        changed = true
      }
    }

    if (type === 'list') {
      sanitizedNode.listType =
        typedNode.listType === 'number' || typedNode.listType === 'bullet' ? (typedNode.listType as string) : 'bullet'

      if (sanitizedNode.listType !== typedNode.listType) {
        changed = true
      }
    }

    if (Array.isArray(typedNode.children)) {
      for (let i = 0; i < sanitizedChildren.length; i += 1) {
        if (sanitizedChildren[i] !== typedNode.children[i]) {
          changed = true
          break
        }
      }
    }

    return { node: sanitizedNode, changed }
  }

  if (type) {
    unknownTypes.add(type)
  } else {
    unknownTypes.add('(unknown)')
  }

  const inlineChildren = buildInlineChildren(sanitizedChildren, version)
  const inlineWithOwnText = inlineChildren.slice()

  if (typeof typedNode.text === 'string' && typedNode.text.trim().length > 0) {
    inlineWithOwnText.unshift(createTextNode(typedNode.text as string, version))
  }

  if (inlineWithOwnText.length === 0) {
    const fallbackText = extractPlainText(typedNode)
    if (fallbackText.trim().length > 0) {
      inlineWithOwnText.push(createTextNode(fallbackText, version))
    }
  }

  if (inlineWithOwnText.length === 0) {
    return { node: null, changed: true }
  }

  if (parentType === 'list') {
    const paragraph = createParagraphNode(inlineWithOwnText, version, typedNode)
    return {
      node: createListItemNode([paragraph], version, typedNode),
      changed: true,
    }
  }

  return {
    node: createParagraphNode(inlineWithOwnText, version, typedNode),
    changed: true,
  }
}

export function sanitizeLexicalJSON(
  value: unknown,
  context?: {
    field?: string
    docId?: string
  },
): unknown {
  if (value === undefined) {
    return undefined
  }

  if (value === null) {
    return null
  }

  if (typeof value !== 'object') {
    return value
  }

  const record = value as { root?: unknown; [key: string]: unknown }
  const unknownTypes = new Set<string>()
  const { node: sanitizedRoot, changed } = sanitizeNode(record.root, 'root', unknownTypes)

  const originalRoot = record.root as {
    version?: unknown
    format?: unknown
    indent?: unknown
    direction?: unknown
    children?: unknown
  } | undefined

  const baseVersion = typeof originalRoot?.version === 'number' ? originalRoot.version : 1
  const baseFormat = typeof originalRoot?.format === 'string' ? originalRoot.format : ''
  const baseIndent = typeof originalRoot?.indent === 'number' ? originalRoot.indent : 0
  const baseDirection = typeof originalRoot?.direction === 'string' ? originalRoot.direction : 'ltr'

  const finalRoot: LexicalNodeJSON =
    sanitizedRoot && sanitizedRoot.type === 'root'
      ? sanitizedRoot
      : {
          type: 'root',
          version: baseVersion,
          format: baseFormat,
          indent: baseIndent,
          direction: baseDirection,
          children: sanitizedRoot ? [sanitizedRoot] : [],
        }

  const sanitizedValue = {
    ...record,
    root: finalRoot,
  }

  if (unknownTypes.size > 0) {
    const contextParts = [context?.docId, context?.field].filter(Boolean)
    const location = contextParts.length > 0 ? ` (${contextParts.join(' :: ')})` : ''
    console.warn(
      `[lexical-sanitize] Stripped unsupported nodes${location}: ${Array.from(unknownTypes).join(', ')}`,
    )
  }

  if (!changed && unknownTypes.size === 0) {
    return value
  }

  return sanitizedValue
}

export const createLexicalSanitizeHook =
  (field: string): FieldHook =>
  ({ value, originalDoc }) =>
    sanitizeLexicalJSON(value, {
      field,
      docId: typeof (originalDoc as { id?: unknown })?.id === 'string' ? ((originalDoc as { id: string }).id) : undefined,
    })
