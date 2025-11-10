export const dynamic = 'force-dynamic'
export const revalidate = 0

import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import { 
  HeartPulse, Baby, Stethoscope, Activity, 
  Syringe, UserCog, BookOpenText, ChevronRight 
} from 'lucide-react'

// Category icons mapping
const categoryIcons: Record<string, React.ReactNode> = {
  medical: <HeartPulse className="h-5 w-5" />,
  cardiac: <Activity className="h-5 w-5" />,
  trauma: <Stethoscope className="h-5 w-5" />,
  pediatric: <Baby className="h-5 w-5" />,
  neonatal: <Baby className="h-5 w-5" />,
  obgyn: <UserCog className="h-5 w-5" />,
  procedures: <Syringe className="h-5 w-5" />,
  behavioral: <BookOpenText className="h-5 w-5" />,
  environmental: <BookOpenText className="h-5 w-5" />,
  'special-ops': <BookOpenText className="h-5 w-5" />,
}

export default async function ProtocolsPage() {
  const payload = await getPayload({ config })

  const protocols = await payload.find({
    collection: 'protocols',
    where: {
      status: { equals: 'published' },
    },
    sort: 'category',
    limit: 1000,
  })

  // Group by category
  const grouped = protocols.docs.reduce((acc, protocol) => {
    const cat = protocol.category || 'uncategorized'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(protocol)
    return acc
  }, {} as Record<string, typeof protocols.docs>)

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Header Section */}
      <div className="bg-white dark:bg-neutral-800 border-b dark:border-neutral-700">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="flex items-center gap-2 text-sm text-neutral-500 mb-3">
            <Link href="/" className="hover:text-neutral-900 dark:hover:text-neutral-100">
              Home
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="font-medium text-neutral-900 dark:text-neutral-100">
              Clinical Protocols
            </span>
          </div>
          
          <h1 className="text-4xl font-bold mb-2">Clinical Protocols</h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-400">
            Browse all active protocols by category
          </p>
          
          <div className="mt-6 flex items-center gap-4 text-sm">
            <div className="px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-700">
              {protocols.docs.length} Active Protocols
            </div>
            <div className="px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-700">
              {Object.keys(grouped).length} Categories
            </div>
          </div>
        </div>
      </div>

      {/* Protocols Grid */}
      <div className="container mx-auto px-4 py-8 max-w-7xl space-y-12">
        {Object.entries(grouped).sort().map(([category, protos]) => (
          <section key={category}>
            {/* Category Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-red-600 flex items-center justify-center text-white">
                {categoryIcons[category] || <BookOpenText className="h-5 w-5" />}
              </div>
              <div>
                <h2 className="text-2xl font-semibold capitalize">
                  {category.replace(/-/g, ' ')}
                </h2>
                <p className="text-sm text-neutral-500">
                  {protos.length} {protos.length === 1 ? 'protocol' : 'protocols'}
                </p>
              </div>
            </div>

            {/* Protocol Cards Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {protos.map((protocol) => (
                <Link
                  key={protocol.id}
                  href={`/protocols/${protocol.id}`}
                  className="group bg-white dark:bg-neutral-800 border dark:border-neutral-700 rounded-2xl p-6 hover:shadow-lg hover:border-red-600 dark:hover:border-red-600 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-lg group-hover:text-red-600 transition-colors">
                      {protocol.title}
                    </h3>
                    <ChevronRight className="h-5 w-5 text-neutral-400 group-hover:text-red-600 group-hover:translate-x-1 transition-all" />
                  </div>
                  
                  {protocol.protocolNumber && (
                    <div className="text-sm text-neutral-500 font-mono mb-2">
                      {protocol.protocolNumber}
                    </div>
                  )}
                  
                  {protocol.subcategory && (
                    <div className="text-sm text-neutral-600 dark:text-neutral-400">
                      {protocol.subcategory}
                    </div>
                  )}
                  
                  {protocol.effectiveDate && (
                    <div className="text-xs text-neutral-400 mt-3 pt-3 border-t dark:border-neutral-700">
                      Effective: {new Date(protocol.effectiveDate).toLocaleDateString()}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
