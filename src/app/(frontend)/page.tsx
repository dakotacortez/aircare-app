import LandingPage from '@/components/LandingPage'
import { getCachedGlobal } from '@/utilities/getGlobals'
import type { SiteSetting } from '@/payload-types'

export const dynamic = 'force-static'

export default async function Page() {
  const siteSettings: SiteSetting = await getCachedGlobal('site-settings', 1)()

  return <LandingPage data={siteSettings} />
}
