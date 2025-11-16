/**
 * Basic test utilities for reference card localStorage functionality
 * Run in browser console or use with testing framework
 */

type CalculationEntry = {
  id: string
  type: 'calculation'
  timestamp: number
  calculatorName: string
  inputs: Record<string, string>
  outputs: Record<string, string>
}

type NoteEntry = {
  id: string
  type: 'note'
  timestamp: number
  timeAction: string
  noteText: string
}

type ReferenceCardEntry = CalculationEntry | NoteEntry

type ReferenceCard = {
  id: string
  name: string
  createdAt: number
  expiresAt: number
  entries: ReferenceCardEntry[]
}

type ReferenceCardTests = {
  createCard: () => ReferenceCard
  addCalculation: (cardId: string) => ReferenceCardEntry | undefined
  addNote: (cardId: string) => ReferenceCardEntry | undefined
  checkExpiration: () => { total: number; active: number; expired: number }
  forceExpiration: (cardId: string) => void
  clearAll: () => void
  viewAll: () => ReferenceCard[]
  runAll: () => void
}

declare global {
  interface Window {
    referenceCardTests?: ReferenceCardTests
  }
}

const STORAGE_KEY = 'acmc-reference-cards'

const readCards = (): ReferenceCard[] => {
  const raw = localStorage.getItem(STORAGE_KEY)
  return raw ? (JSON.parse(raw) as ReferenceCard[]) : []
}

const writeCards = (cards: ReferenceCard[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cards))
}

// Test 1: Create a card
export function testCreateCard(): ReferenceCard {
  const cards = readCards()

  const newCard: ReferenceCard = {
    id: crypto.randomUUID(),
    name: 'Test Card',
    createdAt: Date.now(),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    entries: [],
  }

  cards.push(newCard)
  writeCards(cards)

  console.log('✅ Card created:', newCard)
  return newCard
}

// Test 2: Add calculation entry
export function testAddCalculation(cardId: string) {
  const cards = readCards()
  const card = cards.find((c) => c.id === cardId)

  if (!card) {
    console.error('❌ Card not found')
    return
  }

  const entry: CalculationEntry = {
    id: crypto.randomUUID(),
    type: 'calculation',
    timestamp: Date.now(),
    calculatorName: 'Test Calculator',
    inputs: { weight: '70kg' },
    outputs: { result: '490ml' },
  }

  card.entries.push(entry)
  writeCards(cards)

  console.log('✅ Calculation added:', entry)
  return entry
}

// Test 3: Add note entry
export function testAddNote(cardId: string) {
  const cards = readCards()
  const card = cards.find((c) => c.id === cardId)

  if (!card) {
    console.error('❌ Card not found')
    return
  }

  const entry: NoteEntry = {
    id: crypto.randomUUID(),
    type: 'note',
    timestamp: Date.now(),
    timeAction: '14:30 - Gave bolus',
    noteText: '500ml NS given over 15 minutes',
  }

  card.entries.push(entry)
  writeCards(cards)

  console.log('✅ Note added:', entry)
  return entry
}

// Test 4: Check expiration
export function testExpiration() {
  const cards = readCards()
  const now = Date.now()

  const expired = cards.filter((card) => card.expiresAt <= now)
  const active = cards.filter((card) => card.expiresAt > now)

  console.log(`📊 Total cards: ${cards.length}`)
  console.log(`✅ Active: ${active.length}`)
  console.log(`❌ Expired: ${expired.length}`)

  return { total: cards.length, active: active.length, expired: expired.length }
}

// Test 5: Force expiration (for testing)
export function testForceExpiration(cardId: string) {
  const cards = readCards()
  const card = cards.find((c) => c.id === cardId)

  if (!card) {
    console.error('❌ Card not found')
    return
  }

  card.expiresAt = Date.now() - 1000 // Expired 1 second ago
  writeCards(cards)

  console.log('⏰ Card expired:', card.id)
  console.log('🔄 Refresh the page to see automatic cleanup')
}

// Test 6: Clear all
export function testClearAll() {
  localStorage.removeItem(STORAGE_KEY)
  console.log('🗑️ All cards cleared')
}

// Test 7: View all cards
export function testViewAll() {
  const cards = readCards()
  console.log('📋 All cards:', cards)
  return cards
}

// Run full test suite
export function runAllTests() {
  console.log('🧪 Starting reference card tests...\n')

  // Clean slate
  testClearAll()

  // Create card
  const card = testCreateCard()

  // Add entries
  if (card) {
    testAddCalculation(card.id)
    testAddNote(card.id)
  }

  // Check status
  testExpiration()

  // View results
  testViewAll()

  console.log('\n✅ All tests complete!')
  console.log('💡 Refresh the page to see cards in the UI')
  console.log('💡 Use testForceExpiration(cardId) to test cleanup')
}

// Export for browser console testing
if (typeof window !== 'undefined') {
  window.referenceCardTests = {
    createCard: testCreateCard,
    addCalculation: testAddCalculation,
    addNote: testAddNote,
    checkExpiration: testExpiration,
    forceExpiration: testForceExpiration,
    clearAll: testClearAll,
    viewAll: testViewAll,
    runAll: runAllTests,
  }

  console.log('💡 Reference card tests loaded!')
  console.log('💡 Use: referenceCardTests.runAll()')
}
