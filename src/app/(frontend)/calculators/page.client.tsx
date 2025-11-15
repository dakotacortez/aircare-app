'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { Calculator, Search, X } from 'lucide-react'
import type { Calculator as CalculatorType } from '@/payload-types'

interface CalculatorsClientProps {
  calculators: CalculatorType[]
}

export function CalculatorsClient({ calculators }: CalculatorsClientProps) {
  const [searchQuery, setSearchQuery] = useState('')

  // Filter calculators
  const filteredCalculators = useMemo(() => {
    return calculators.filter((calc) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesTitle = calc.title.toLowerCase().includes(query)
        const matchesDescription = calc.description?.toLowerCase().includes(query)
        const matchesTags = calc.tags?.some((tag) =>
          tag.tag?.toLowerCase().includes(query)
        )
        if (!matchesTitle && !matchesDescription && !matchesTags) {
          return false
        }
      }

      return true
    })
  }, [calculators, searchQuery])

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
              <Calculator className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                Medical Calculators
              </h1>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Clinical decision support tools for critical care
              </p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search calculators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-3 bg-white dark:bg-neutral-800 border dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-neutral-900 dark:text-neutral-100"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>


        {/* Results Count */}
        <div className="mb-4 text-sm text-neutral-600 dark:text-neutral-400">
          {filteredCalculators.length} calculator{filteredCalculators.length !== 1 ? 's' : ''} found
        </div>

        {/* Calculator Grid */}
        {filteredCalculators.length === 0 ? (
          <div className="bg-white dark:bg-neutral-800 border dark:border-neutral-700 rounded-2xl shadow-sm p-12 text-center">
            <Calculator className="h-12 w-12 mx-auto text-neutral-400 mb-4" />
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
              No Calculators Found
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              Try adjusting your search
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCalculators.map((calc) => (
              <Link
                key={calc.id}
                href={`/calculators/${calc.key}`}
                className="bg-white dark:bg-neutral-800 border dark:border-neutral-700 rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {calc.title}
                  </h3>
                </div>
                {calc.description && (
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
                    {calc.description}
                  </p>
                )}
                {calc.tags && calc.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {calc.tags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 text-xs bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 rounded"
                      >
                        {tag.tag}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
