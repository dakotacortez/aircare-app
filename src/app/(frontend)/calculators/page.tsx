export const dynamic = 'force-dynamic'
export const revalidate = 0

import { getPayload } from 'payload'
import config from '@payload-config'
import type { Calculator } from '@/payload-types'
import { CalculatorsClient } from './page.client'

export default async function CalculatorsPage() {
  const payload = await getPayload({ config })
  
  const calculatorsResult = await payload.find({
    collection: 'calculators',
    where: {
      enabled: { equals: true },
    },
    limit: 1000,
    sort: 'defaultOrder',
  })

  const calculators = calculatorsResult.docs as Calculator[]

  return <CalculatorsClient calculators={calculators} />
}

export const metadata = {
  title: 'Medical Calculators | ACMC',
  description:
    'Quick reference medical calculators for ventilator settings, drug doses, and critical care scenarios.',
}
