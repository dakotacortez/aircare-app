/**
 * Basic test utilities for reference card localStorage functionality
 * Run in browser console or use with testing framework
 */

import type { ReferenceCard } from '@/types/referenceCard'

declare global {
  interface Window {
    referenceCardTests?: {
      createCard: typeof testCreateCard
      addCalculation: typeof testAddCalculation
      addNote: typeof testAddNote
      checkExpiration: typeof testExpiration
      forceExpiration: typeof testForceExpiration
      clearAll: typeof testClearAll
      viewAll: typeof testViewAll
      runAll: typeof runAllTests
    }
  }
}

// Test 1: Create a card
export function testCreateCard() {
  const cards = JSON.parse(localStorage.getItem('acmc-reference-cards') || '[]')
  
  const newCard = {
    id: crypto.randomUUID(),
    name: 'Test Card',
    createdAt: Date.now(),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    entries: []
  }
  
  cards.push(newCard)
  localStorage.setItem('acmc-reference-cards', JSON.stringify(cards))
  
  console.log('✅ Card created:', newCard)
  return newCard
}

// Test 2: Add calculation entry
export function testAddCalculation(cardId: string) {
  const cards: ReferenceCard[] = JSON.parse(localStorage.getItem('acmc-reference-cards') || '[]')
  const card = cards.find((c: ReferenceCard) => c.id === cardId)
  
  if (!card) {
    console.error('❌ Card not found')
    return
  }
  
  const entry = {
    id: crypto.randomUUID(),
    type: 'calculation',
    timestamp: Date.now(),
    calculatorName: 'Test Calculator',
    inputs: { weight: '70kg' },
    outputs: { result: '490ml' }
  }
  
  card.entries.push(entry)
  localStorage.setItem('acmc-reference-cards', JSON.stringify(cards))
  
  console.log('✅ Calculation added:', entry)
  return entry
}

// Test 3: Add note entry
export function testAddNote(cardId: string) {
  const cards: ReferenceCard[] = JSON.parse(localStorage.getItem('acmc-reference-cards') || '[]')
  const card = cards.find((c: ReferenceCard) => c.id === cardId)
  
  if (!card) {
    console.error('❌ Card not found')
    return
  }
  
  const entry = {
    id: crypto.randomUUID(),
    type: 'note',
    timestamp: Date.now(),
    timeAction: '14:30 - Gave bolus',
    noteText: '500ml NS given over 15 minutes'
  }
  
  card.entries.push(entry)
  localStorage.setItem('acmc-reference-cards', JSON.stringify(cards))
  
  console.log('✅ Note added:', entry)
  return entry
}

// Test 4: Check expiration
export function testExpiration() {
  const cards: ReferenceCard[] = JSON.parse(localStorage.getItem('acmc-reference-cards') || '[]')
  const now = Date.now()

  const expired = cards.filter((card: ReferenceCard) => card.expiresAt <= now)
  const active = cards.filter((card: ReferenceCard) => card.expiresAt > now)
  
  console.log(`📊 Total cards: ${cards.length}`)
  console.log(`✅ Active: ${active.length}`)
  console.log(`❌ Expired: ${expired.length}`)
  
  return { total: cards.length, active: active.length, expired: expired.length }
}

// Test 5: Force expiration (for testing)
export function testForceExpiration(cardId: string) {
  const cards: ReferenceCard[] = JSON.parse(localStorage.getItem('acmc-reference-cards') || '[]')
  const card = cards.find((c: ReferenceCard) => c.id === cardId)
  
  if (!card) {
    console.error('❌ Card not found')
    return
  }
  
  card.expiresAt = Date.now() - 1000 // Expired 1 second ago
  localStorage.setItem('acmc-reference-cards', JSON.stringify(cards))
  
  console.log('⏰ Card expired:', card.id)
  console.log('🔄 Refresh the page to see automatic cleanup')
}

// Test 6: Clear all
export function testClearAll() {
  localStorage.removeItem('acmc-reference-cards')
  console.log('🗑️ All cards cleared')
}

// Test 7: View all cards
export function testViewAll() {
  const cards = JSON.parse(localStorage.getItem('acmc-reference-cards') || '[]')
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
    runAll: runAllTests
  }
  
  console.log('💡 Reference card tests loaded!')
  console.log('💡 Use: referenceCardTests.runAll()')
}
