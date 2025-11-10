/**
 * OPTION C: Sequential Tags (Current Implementation)
 * No code changes needed - just usage patterns
 * Tags placed sequentially to achieve nesting-like effect
 */

/**
 * CURRENT IMPLEMENTATION (DecoratorNode)
 * Each certification tag is a separate inline node that cannot contain children
 */

import { DecoratorNode } from 'lexical'

// This is what we have now - works perfectly for sequential usage
export class CertificationLevelNode extends DecoratorNode<React.JSX.Element> {
  __certLevel: CertLevelKey
  __text: string

  // Renders as single inline badge with text
  // Cannot contain other nodes as children
}

/**
 * USAGE PATTERNS WITH SEQUENTIAL TAGS
 */

// PATTERN 1: Simple sequential tagging
// User workflow:
// 1. Type: "Give aspirin to ALS, morphine to CCT"
// 2. Select "aspirin" → click ALS
// 3. Select "morphine" → click CCT

// Result JSON:
const example1 = {
  type: 'paragraph',
  children: [
    { type: 'text', text: 'Give ' },
    { type: 'certification-level', certLevel: 'als', text: 'aspirin' },
    { type: 'text', text: ' to ALS, ' },
    { type: 'certification-level', certLevel: 'cct', text: 'morphine' },
    { type: 'text', text: ' to CCT' },
  ],
}

// Visual: Give [ALS: aspirin] to ALS, [CCT: morphine] to CCT

// PATTERN 2: Sequential tags for "nested-like" effect
// User workflow:
// 1. Type: "Call for more nitro (ALS requires medical control)"
// 2. Select "Call for more nitro" → click Medical Control
// 3. Then wrap that whole section (or just add text before/after)

// Result JSON:
const example2 = {
  type: 'paragraph',
  children: [
    { type: 'text', text: 'ALS: ' },
    { type: 'certification-level', certLevel: 'medicalControl', text: 'Call for more nitro' },
    { type: 'text', text: ' | CCT: Give additional nitro per protocol' },
  ],
}

// Visual: ALS: [Medical Control: Call for more nitro] | CCT: Give additional nitro per protocol

// PATTERN 3: Multiple callouts in sequence
// User workflow for your use case:
// "ALS requires medical control for extra nitro, but CCT can give standing order"

// Result JSON:
const example3 = {
  type: 'paragraph',
  children: [
    { type: 'certification-level', certLevel: 'als', text: 'Extra nitro: ' },
    {
      type: 'certification-level',
      certLevel: 'medicalControl',
      text: 'Call medical control for authorization',
    },
    { type: 'text', text: ' ' },
    {
      type: 'certification-level',
      certLevel: 'cct',
      text: 'Give additional nitro per standing order',
    },
  ],
}

// Visual: [ALS: Extra nitro: ][Medical Control: Call medical control for authorization] [CCT: Give additional nitro per standing order]

/**
 * RENDERING SEQUENTIAL TAGS (Current Implementation)
 */

// This already works with RichTextContent.tsx
function renderSequentialTags(node: any, userLevel: number): React.ReactNode {
  if (node.type === 'certification-level') {
    const certData = CERT_LEVELS[node.certLevel]
    const canView = canViewContent(userLevel, certData.level)

    if (!canView) return null // Filtered out

    // Single badge with text inside
    return (
      <span
        className="cert-level-badge-frontend"
        style={{
          backgroundColor: certData.color,
          color: 'white',
        }}
      >
        {certData.label}: {node.text}
      </span>
    )
  }
}

/**
 * COMPARISON: What you get with each option
 */

// YOUR USE CASE:
// "[ALS][Medical Control: Call for more nitro][/ALS] [CCT]Give additional nitro per protocol[/CCT]"

// ============================================================================
// OPTION A (ElementNode) - TRUE NESTING
// ============================================================================
// Markup: User selects "Call for more nitro", clicks Medical Control, then selects
//         that whole thing + surrounding text, clicks ALS
//
// JSON Structure:
const optionA_structure = {
  children: [
    {
      type: 'certification-level',
      certLevel: 'als',
      children: [
        {
          type: 'certification-level',
          certLevel: 'medicalControl',
          children: [{ type: 'text', text: 'Call for more nitro' }],
        },
      ],
    },
    { type: 'text', text: ' ' },
    {
      type: 'certification-level',
      certLevel: 'cct',
      children: [{ type: 'text', text: 'Give additional nitro per protocol' }],
    },
  ],
}
//
// Visual Result: [ALS: [Medical Control: Call for more nitro]] [CCT: Give additional nitro per protocol]
//
// Pros:
// - True semantic nesting
// - Clear hierarchy in JSON
// - Can apply ALS filtering to entire block including Medical Control tag
//
// Cons:
// - More complex implementation (rewrite node from DecoratorNode to ElementNode)
// - Need to handle complex editor selection/wrapping logic
// - More complex rendering logic

// ============================================================================
// OPTION C (Sequential) - CURRENT IMPLEMENTATION, NO CODE CHANGES
// ============================================================================
// Markup: User types text inline with context markers
//
// JSON Structure:
const optionC_structure = {
  children: [
    { type: 'text', text: 'ALS providers: ' },
    {
      type: 'certification-level',
      certLevel: 'medicalControl',
      text: 'Call for more nitro',
    },
    { type: 'text', text: ' | CCT providers: Give additional nitro per protocol' },
  ],
}
//
// OR with explicit ALS tag:
const optionC_alternative = {
  children: [
    {
      type: 'certification-level',
      certLevel: 'als',
      text: 'For extra nitro - ',
    },
    {
      type: 'certification-level',
      certLevel: 'medicalControl',
      text: 'call medical control',
    },
    { type: 'text', text: '. ' },
    {
      type: 'certification-level',
      certLevel: 'cct',
      text: 'Give per standing order',
    },
  ],
}
//
// Visual Result: [ALS: For extra nitro - ][Medical Control: call medical control]. [CCT: Give per standing order]
//
// Pros:
// - Works RIGHT NOW with zero code changes
// - Simple, predictable behavior
// - Easy to understand for content editors
// - All filtering logic already works
//
// Cons:
// - Cannot truly "nest" Medical Control inside ALS tag
// - Requires content to be written in a specific pattern
// - Visual nesting is achieved through text context, not structure

/**
 * RECOMMENDED APPROACH FOR YOUR USE CASE
 */

// I recommend OPTION C (Sequential) because:
//
// 1. Your actual need is to show:
//    "ALS requires medical control for X, but CCT can do Y"
//
// 2. This can be written as:
//    "[ALS: text][Medical Control: requirement] [CCT: alternative]"
//
// 3. Works TODAY with no code changes
//
// 4. Content structure:
const recommended = {
  type: 'paragraph',
  children: [
    {
      type: 'certification-level',
      certLevel: 'als',
      text: 'Additional nitroglycerin: ',
    },
    {
      type: 'certification-level',
      certLevel: 'medicalControl',
      text: 'Obtain authorization from medical control',
    },
    { type: 'text', text: '. ' },
    {
      type: 'certification-level',
      certLevel: 'cct',
      text: 'May administer per standing order (see CCT protocols)',
    },
  ],
}

// This renders as:
// [ALS: Additional nitroglycerin: ][Medical Control: Obtain authorization from medical control]. [CCT: May administer per standing order (see CCT protocols)]

// When viewed by ALS user (level 3):
// Shows: [ALS: Additional nitroglycerin: ][Medical Control: Obtain authorization from medical control].
// Hides: CCT content

// When viewed by CCT user (level 4):
// Shows: [ALS: Additional nitroglycerin: ][Medical Control: Obtain authorization from medical control]. [CCT: May administer per standing order (see CCT protocols)]

// When viewed by Basic user (level 0):
// Shows: [Medical Control: Obtain authorization from medical control].
// Hides: Both ALS and CCT content (but sees the callout because callouts are always visible)
