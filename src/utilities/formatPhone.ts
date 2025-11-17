/**
 * Smart phone number formatter
 * Formats phone numbers consistently across the application
 * Handles 10-digit, 7-digit, and already-formatted numbers
 */
export function formatPhone(phone: string | undefined | null): string {
  if (!phone) return ''

  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '')

  // Handle 10-digit US phone numbers
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }

  // Handle 7-digit local numbers
  if (digits.length === 7) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`
  }

  // Handle 11-digit numbers (1 + 10 digits)
  if (digits.length === 11 && digits[0] === '1') {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`
  }

  // Return original if it doesn't match expected patterns
  return phone
}
