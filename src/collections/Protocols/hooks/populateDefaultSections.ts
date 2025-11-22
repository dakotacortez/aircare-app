import type { FieldHook } from 'payload'

/**
 * Hook to populate default sections from Protocol Defaults global
 * Only applies when creating a new protocol with empty sections
 */
export const populateDefaultSections: FieldHook = async ({ value, req, operation }) => {
  // Only populate on create operations when sections are not provided
  if (operation === 'create' && (!value || value.length === 0)) {
    try {
      // Fetch the protocol defaults global
      const protocolDefaults = await req.payload.findGlobal({
        slug: 'protocol-defaults',
      })

      // Return the default sections if available
      if (protocolDefaults?.defaultSections && Array.isArray(protocolDefaults.defaultSections)) {
        return protocolDefaults.defaultSections
      }
    } catch (error) {
      // If there's an error fetching defaults, log it and continue without defaults
      req.payload.logger.error('Failed to fetch protocol defaults:', error)
    }
  }

  // Return the existing value if not a create operation or if sections already exist
  return value
}
