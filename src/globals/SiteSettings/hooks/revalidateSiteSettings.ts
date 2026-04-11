import type { GlobalAfterChangeHook } from 'payload'
import { revalidatePath, revalidateTag } from 'next/cache'

export const revalidateSiteSettings: GlobalAfterChangeHook = ({ doc, req: { payload } }) => {
  payload.logger.info('Revalidating site settings')

  // Revalidate the cached global data
  revalidateTag('global_site-settings')

  // Revalidate homepage and all common paths when site settings change
  revalidatePath('/', 'layout')
  revalidatePath('/protocols')
  revalidatePath('/login')
  revalidatePath('/signup')

  return doc
}
