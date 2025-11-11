import type { GlobalAfterChangeHook } from 'payload'
import { revalidatePath } from 'next/cache'

export const revalidateSiteSettings: GlobalAfterChangeHook = ({ doc, req: { payload } }) => {
  payload.logger.info('Revalidating site settings')

  // Revalidate homepage and all common paths when site settings change
  revalidatePath('/', 'layout')
  revalidatePath('/protocols')
  revalidatePath('/login')
  revalidatePath('/signup')

  return doc
}
