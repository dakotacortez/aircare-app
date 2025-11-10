'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import type { Protocol } from '@/payload-types'
import { ProtocolTree } from '@/components/ProtocolTree'
import { ProtocolTools } from '@/components/ProtocolTools'
import { ChevronRight, Menu } from 'lucide-react'

interface ProtocolContentProps {
  protocol: Protocol
  allProtocols: Protocol[]
}

type LexicalNode = {
  children?: LexicalNode[]
  text?: string
}

type LexicalContent = {
  root?: {
    children?: LexicalNode[]
  }
} | null

// Simple function to render Lexical content as plain text
function renderLexicalContent(content: LexicalContent): string {
  if (!content?.root?.children) return ''

  const extractText = (node: LexicalNode): string => {
    if (node.text) return node.text
    if (node.children?.length) {
      return node.children.map(extractText).join('')
    }
    return ''
  }

  return content.root.children
    .map((node) => extractText(node))
    .filter((text) => text.trim())
    .join('\n\n')
}

export function ProtocolContent({ protocol, allProtocols }: ProtocolContentProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [toolsOpen, setToolsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkViewport = () => {
      const width = window.innerWidth
      setIsMobile(width < 768)
      setSidebarOpen(width >= 768)
    }
    checkViewport()
    window.addEventListener('resize', checkViewport)
    return () => window.removeEventListener('resize', checkViewport)
  }, [])

  useEffect(() => {
    const shouldBlock = (sidebarOpen && isMobile) || toolsOpen
    document.body.style.overflow = shouldBlock ? 'hidden' : 'unset'
    return () => { document.body.style.overflow = 'unset' }
  }, [sidebarOpen, toolsOpen, isMobile])

  return (
    <>
      {/* Sub-header with menu button */}
      <div className="h-12 border-b dark:border-neutral-700 bg-white dark:bg-neutral-800 flex items-center gap-3 px-4 sticky top-16 z-30">
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)} 
          className="rounded-xl border dark:border-neutral-700 px-3 py-2 text-sm inline-flex items-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-700"
        >
          <Menu className="h-4 w-4" />
        </button>
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-xs text-neutral-500">
          <Link href="/protocols" className="hover:text-neutral-900 dark:hover:text-neutral-100">
            Protocols
          </Link>
          <ChevronRight className="h-3 w-3" />
          {protocol.category && (
            <>
              <span className="capitalize">{protocol.category.replace(/-/g, ' ')}</span>
              <ChevronRight className="h-3 w-3" />
            </>
          )}
          <span className="font-medium text-neutral-900 dark:text-neutral-100">
            {protocol.title}
          </span>
        </div>
      </div>

      {/* 3-Column Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar - Protocol Tree */}
        <ProtocolTree 
          protocols={allProtocols}
          currentProtocolId={protocol.id}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-neutral-50 dark:bg-neutral-900">
          <div className="px-4 md:px-6 py-6 max-w-4xl mx-auto">
            {/* Protocol Header */}
            <div className="mb-6">
              <div className="flex items-center gap-4 text-sm text-neutral-500 mb-2">
                {protocol.protocolNumber && (
                  <span className="font-mono">{protocol.protocolNumber}</span>
                )}
                {protocol.effectiveDate && (
                  <span>
                    Effective: {new Date(protocol.effectiveDate).toLocaleDateString()}
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-bold">{protocol.title}</h1>
              {protocol.subcategory && (
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                  {protocol.subcategory}
                </p>
              )}
            </div>

            {/* Protocol Content */}
            <section className="bg-white dark:bg-neutral-800 border dark:border-neutral-700 rounded-2xl shadow-sm p-6 space-y-6">
              {/* Main Content */}
              {protocol.content && (
                <div className="prose dark:prose-invert max-w-none">
                  <div className="whitespace-pre-line">
                    {renderLexicalContent(protocol.content)}
                  </div>
                </div>
              )}

              {/* Indications */}
              {protocol.indications && (
                <div className="rounded-xl border-2 border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/30 p-4">
                  <h3 className="text-sm font-semibold mb-2 text-blue-900 dark:text-blue-100">
                    Indications
                  </h3>
                  <div className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-line">
                    {renderLexicalContent(protocol.indications)}
                  </div>
                </div>
              )}

              {/* Contraindications */}
              {protocol.contraindications && (
                <div className="rounded-xl border-2 border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/30 p-4">
                  <h3 className="text-sm font-semibold mb-2 text-red-900 dark:text-red-100">
                    Contraindications
                  </h3>
                  <div className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-line">
                    {renderLexicalContent(protocol.contraindications)}
                  </div>
                </div>
              )}

              {/* Considerations */}
              {protocol.considerations && (
                <div className="rounded-xl border-2 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 p-4">
                  <h3 className="text-sm font-semibold mb-2 text-amber-900 dark:text-amber-100">
                    Special Considerations
                  </h3>
                  <div className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-line">
                    {renderLexicalContent(protocol.considerations)}
                  </div>
                </div>
              )}
            </section>

            {/* Version Info */}
            <div className="mt-6 text-sm text-neutral-500 flex items-center gap-4">
              {protocol.versionNumber && (
                <span>Version {protocol.versionNumber}</span>
              )}
              {protocol.lastReviewed && (
                <span>
                  Last Reviewed: {new Date(protocol.lastReviewed).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </main>

        {/* Right Sidebar - Tools */}
        <ProtocolTools 
          isOpen={toolsOpen}
          onClose={() => setToolsOpen(!toolsOpen)}
        />

        {/* Backdrop for mobile */}
        {((sidebarOpen && isMobile) || toolsOpen) && (
          <div 
            className="fixed inset-0 bg-black/50 z-30" 
            onClick={() => { 
              if (isMobile) setSidebarOpen(false)
              setToolsOpen(false)
            }} 
          />
        )}
      </div>
    </>
  )
}
