'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import type { Protocol } from '@/payload-types'
import { ProtocolTree } from '@/components/ProtocolTree'
import { ProtocolTools } from '@/components/ProtocolTools'
import {
  RichTextContent,
  type SerializedRichTextState,
  type RichTextSerializedNode,
} from '@/components/RichTextContent'
import { useServiceLine } from '@/providers/ServiceLine'
import { ChevronRight, FolderTree } from 'lucide-react'

interface ProtocolContentProps {
  protocol: Protocol
  allProtocols: Protocol[]
}

/**
 * Check if Lexical content is empty
 */
function hasContent(content: SerializedRichTextState | null | undefined): boolean {
  const root = content?.root
  if (!root?.children || root.children.length === 0) {
    return false
  }

  return root.children.some((child) => {
    if (!child) {
      return false
    }

    if (child.type === 'paragraph') {
      return child.children ? child.children.some(hasMeaningfulText) : false
    }

    return true
  })
}

function hasMeaningfulText(node: RichTextSerializedNode | undefined): boolean {
  if (!node) {
    return false
  }

  if (typeof node.text === 'string' && node.text.trim().length > 0) {
    return true
  }

  return node.children ? node.children.some(hasMeaningfulText) : false
}

export function ProtocolContent({ protocol, allProtocols }: ProtocolContentProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [toolsOpen, setToolsOpen] = useState(false)
  const [toolsCollapsed, setToolsCollapsed] = useState(false)
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
        {/* Show button on mobile and small tablets, hide on desktop/large tablet */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="md:hidden rounded-xl border dark:border-neutral-700 px-3 py-2 text-sm inline-flex items-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-700"
        >
          <FolderTree className="h-4 w-4" />
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
          currentProtocolNumber={protocol.protocolNumber}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
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
              {/* Universal Protocol */}
              {protocol.contentUniversal && (
                <div>
                  <div className="py-4 border-b border-gray-200 dark:border-neutral-700">
                    <h3 className="text-gray-800 dark:text-neutral-100 text-2xl font-bold">
                      Universal Protocol
                    </h3>
                  </div>
                  <div className="prose dark:prose-invert max-w-none protocol-content mt-4">
                    <RichTextContent
                      content={protocol.contentUniversal}
                      showBadges={false}
                      serviceLine={serviceLine}
                    />
                  </div>
                </div>
              )}

              {/* BLS Protocol */}
              {serviceLine === 'BLS' && protocol.contentBLS && (
                <div>
                  <div className="py-4 border-b border-gray-200 dark:border-neutral-700">
                    <h3 className="text-gray-800 dark:text-neutral-100 text-2xl font-bold">
                      BLS Protocol
                    </h3>
                  </div>
                  <div className="prose dark:prose-invert max-w-none protocol-content mt-4">
                    <RichTextContent
                      content={protocol.contentBLS}
                      showBadges={false}
                      serviceLine={serviceLine}
                    />
                  </div>
                </div>
              )}

              {/* ALS Protocol */}
              {serviceLine === 'ALS' && protocol.contentALS && (
                <div>
                  <div className="py-4 border-b border-gray-200 dark:border-neutral-700">
                    <h3 className="text-gray-800 dark:text-neutral-100 text-2xl font-bold">
                      ALS Protocol
                    </h3>
                  </div>
                  <div className="prose dark:prose-invert max-w-none protocol-content mt-4">
                    <RichTextContent
                      content={protocol.contentALS}
                      showBadges={false}
                      serviceLine={serviceLine}
                    />
                  </div>
                </div>
              )}

              {/* CCT Protocol */}
              {serviceLine === 'CCT' && protocol.contentCCT && (
                <div>
                  <div className="py-4 border-b border-gray-200 dark:border-neutral-700">
                    <h3 className="text-gray-800 dark:text-neutral-100 text-2xl font-bold">
                      CCT Protocol
                    </h3>
                  </div>
                  <div className="prose dark:prose-invert max-w-none protocol-content mt-4">
                    <RichTextContent
                      content={protocol.contentCCT}
                      showBadges={false}
                      serviceLine={serviceLine}
                    />
                  </div>
                </div>
              )}

              {/* Key Considerations (only shown if has content) */}
              {hasContent(protocol.specialConsiderations) && (
                <div>
                  <div className="py-4 border-b border-gray-200 dark:border-neutral-700">
                    <h3 className="text-gray-800 dark:text-neutral-100 text-2xl font-bold">
                      Key Considerations
                    </h3>
                  </div>
                  <div className="prose dark:prose-invert max-w-none protocol-content mt-4">
                    <RichTextContent
                      content={protocol.specialConsiderations}
                      showBadges={false}
                      serviceLine={serviceLine}
                    />
                  </div>
                </div>
              )}

              {/* Pearls (only shown if has content) */}
              {hasContent(protocol.keyPoints) && (
                <div>
                  <div className="py-4 border-b border-gray-200 dark:border-neutral-700">
                    <h3 className="text-gray-800 dark:text-neutral-100 text-2xl font-bold">
                      Pearls
                    </h3>
                  </div>
                  <div className="prose dark:prose-invert max-w-none protocol-content mt-4">
                    <RichTextContent
                      content={protocol.keyPoints}
                      showBadges={false}
                      serviceLine={serviceLine}
                    />
                  </div>
                </div>
              )}

              {/* References & Graphics (only shown if has content) */}
              {hasContent(protocol.references) && (
                <div>
                  <div className="py-4 border-b border-gray-200 dark:border-neutral-700">
                    <h3 className="text-gray-800 dark:text-neutral-100 text-2xl font-bold">
                      References & Graphics
                    </h3>
                  </div>
                  <div className="prose dark:prose-invert max-w-none protocol-content mt-4">
                    <RichTextContent
                      content={protocol.references}
                      showBadges={false}
                      serviceLine={serviceLine}
                    />
                  </div>
                </div>
              )}
            </section>

            {/* Version Info */}
            {protocol.lastReviewed && (
              <div className="mt-6 text-sm text-neutral-500">
                <span>
                  Last Reviewed: {new Date(protocol.lastReviewed).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </main>

        {/* Right Sidebar - Tools */}
        <ProtocolTools
          isOpen={toolsOpen}
          onClose={() => setToolsOpen(!toolsOpen)}
          isCollapsed={toolsCollapsed}
          onToggleCollapse={() => setToolsCollapsed(!toolsCollapsed)}
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