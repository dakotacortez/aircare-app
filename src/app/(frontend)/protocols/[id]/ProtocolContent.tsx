'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import type { Protocol } from '@/payload-types'
import { ProtocolTree } from '@/components/ProtocolTree'
import { ProtocolTools } from '@/components/ProtocolTools'
import { RichTextContent } from '@/components/RichTextContent'
import { useServiceLine } from '@/providers/ServiceLine'
import { ChevronRight, Menu } from 'lucide-react'

interface ProtocolContentProps {
  protocol: Protocol
  allProtocols: Protocol[]
}

/**
 * Check if Lexical content is empty
 */
function hasContent(content: any): boolean {
  if (!content || !content.root) return false
  if (!content.root.children || content.root.children.length === 0) return false

  // Check if all children are empty paragraphs
  const hasNonEmptyContent = content.root.children.some((child: any) => {
    if (child.type === 'paragraph') {
      return child.children && child.children.length > 0
    }
    return true // Non-paragraph nodes count as content
  })

  return hasNonEmptyContent
}

export function ProtocolContent({ protocol, allProtocols }: ProtocolContentProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [toolsOpen, setToolsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const { serviceLine } = useServiceLine()

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
              {/* Universal Content (always shown) */}
              {protocol.contentUniversal && (
                <div className="prose dark:prose-invert max-w-none protocol-content">
                  <RichTextContent content={protocol.contentUniversal} showBadges={true} />
                </div>
              )}

              {/* BLS Zone */}
              {serviceLine === 'BLS' && protocol.contentBLS && (
                <div className="prose dark:prose-invert max-w-none protocol-content">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-sm font-medium mb-4">
                    <span className="h-2 w-2 rounded-full bg-green-600"></span>
                    BLS Protocol
                  </div>
                  <RichTextContent content={protocol.contentBLS} showBadges={true} />
                </div>
              )}

              {/* ALS Zone */}
              {serviceLine === 'ALS' && protocol.contentALS && (
                <div className="prose dark:prose-invert max-w-none protocol-content">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 text-sm font-medium mb-4">
                    <span className="h-2 w-2 rounded-full bg-purple-600"></span>
                    ALS Protocol
                  </div>
                  <RichTextContent content={protocol.contentALS} showBadges={true} />
                </div>
              )}

              {/* CCT Zone */}
              {serviceLine === 'CCT' && protocol.contentCCT && (
                <div className="prose dark:prose-invert max-w-none protocol-content">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 text-sm font-medium mb-4">
                    <span className="h-2 w-2 rounded-full bg-red-600"></span>
                    CCT Protocol
                  </div>
                  <RichTextContent content={protocol.contentCCT} showBadges={true} />
                </div>
              )}

              {/* Special Considerations (only shown if has content) */}
              {hasContent(protocol.specialConsiderations) && (
                <div className="rounded-xl border-2 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 p-4">
                  <h3 className="text-sm font-semibold mb-2 text-amber-900 dark:text-amber-100">
                    Special Considerations
                  </h3>
                  <div className="text-sm text-neutral-700 dark:text-neutral-300 protocol-content">
                    <RichTextContent content={protocol.specialConsiderations} showBadges={true} />
                  </div>
                </div>
              )}

              {/* Key Points (only shown if has content) */}
              {hasContent(protocol.keyPoints) && (
                <div className="rounded-xl border-2 border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/30 p-4">
                  <h3 className="text-sm font-semibold mb-2 text-blue-900 dark:text-blue-100">
                    Key Points / Pearls
                  </h3>
                  <div className="text-sm text-neutral-700 dark:text-neutral-300 protocol-content">
                    <RichTextContent content={protocol.keyPoints} showBadges={true} />
                  </div>
                </div>
              )}

              {/* References & Graphics (only shown if has content) */}
              {hasContent(protocol.references) && (
                <div className="rounded-xl border dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50 p-4">
                  <h3 className="text-sm font-semibold mb-2 text-neutral-900 dark:text-neutral-100">
                    References & Graphics
                  </h3>
                  <div className="text-sm text-neutral-700 dark:text-neutral-300 protocol-content">
                    <RichTextContent content={protocol.references} showBadges={true} />
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