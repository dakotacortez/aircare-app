'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import type { Protocol, Medication } from '@/payload-types'
import { ProtocolTree } from '@/components/ProtocolTree'
import { ProtocolTools } from '@/components/ProtocolTools'
import {
  RichTextContent,
  type SerializedRichTextState,
} from '@/components/RichTextContent'
import { useServiceLine } from '@/providers/ServiceLine'
import {
  ChevronRight,
  FolderTree,
  Book,
  Activity,
  AlertCircle,
  Clock,
  Phone,
  CheckSquare,
  Square,
} from 'lucide-react'

interface ProtocolContentProps {
  protocol: Protocol
  allProtocols: Protocol[]
}

type ViewMode = 'study' | 'active'
type CertLevel = 'BLS' | 'ALS' | 'CCT'

interface ActionStep {
  id?: string
  stepNumber: number
  action: string
  scope?: CertLevel[]
  timing?: string | null
  requiresMedControl?: boolean | null
  protocolReferences?: Array<{
    protocol: number | Protocol
    label?: string | null
    id?: string
  }> | null
  details?: Array<{
    detail: string
    id?: string
  }> | null
}

interface ProtocolSection {
  id?: string
  heading: string
  scope?: CertLevel[]
  note?: string | null
  contentType: 'actionSteps' | 'bulletList' | 'richText'
  bulletList?: SerializedRichTextState | null
  richText?: SerializedRichTextState | null
  actionSteps?: ActionStep[]
}

/**
 * Check if content is in scope for current certification level
 */
function isInScope(scope: CertLevel[] | undefined | null, certLevel: CertLevel): boolean {
  // Empty scope = all levels
  if (!scope || scope.length === 0) return true

  if (certLevel === 'BLS') {
    return scope.includes('BLS')
  } else if (certLevel === 'ALS') {
    return scope.includes('BLS') || scope.includes('ALS')
  } else if (certLevel === 'CCT') {
    return true // CCT can do everything
  }

  return false
}

/**
 * Get scope label for display
 */
function getScopeLabel(scope: CertLevel[] | undefined | null): string | null {
  if (!scope || scope.length === 0) return null // All levels
  if (scope.length === 3) return null // All levels
  return scope.join('/')
}

/**
 * Get color-coded border class for action step
 */
function getStepBorderColor(scope: CertLevel[] | undefined | null, darkMode: boolean): string {
  if (!scope || scope.length === 0 || scope.length === 3) {
    // All levels
    return darkMode ? 'border-l-neutral-600' : 'border-l-neutral-300'
  }

  if (scope.length === 1 && scope.includes('BLS')) {
    return 'border-l-green-600' // BLS only
  }

  if (scope.includes('CCT') && !scope.includes('BLS')) {
    return 'border-l-indigo-600' // CCT only
  }

  return 'border-l-purple-600' // ALS/CCT
}

/**
 * Get badge color for scope
 */
function getScopeBadgeColor(scope: CertLevel[] | undefined | null, certLevel: CertLevel): string {
  const scopeLabel = getScopeLabel(scope)
  if (!scopeLabel) return 'bg-neutral-500 text-white'

  if (certLevel === 'BLS' && scope?.includes('BLS')) {
    return 'bg-green-600 text-white'
  }
  if (certLevel === 'ALS' && (scope?.includes('BLS') || scope?.includes('ALS'))) {
    return 'bg-purple-600 text-white'
  }
  if (certLevel === 'CCT') {
    return 'bg-indigo-600 text-white'
  }

  return 'bg-neutral-600 text-neutral-300'
}

/**
 * Render clickable protocol codes in action text
 */
function renderActionWithLinks(text: string, onProtocolClick: (code: string) => void) {
  const protocolCodeRegex = /\b([A-Z]{1,2}\d{3,4})\b/g
  const parts = text.split(protocolCodeRegex)

  return parts.map((part, index) => {
    if (part.match(protocolCodeRegex)) {
      return (
        <button
          key={index}
          onClick={() => onProtocolClick(part)}
          className="text-blue-600 dark:text-blue-400 hover:underline font-bold mx-1"
        >
          {part} →
        </button>
      )
    }
    return <span key={index}>{part}</span>
  })
}

export function ProtocolContent({ protocol, allProtocols }: ProtocolContentProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [toolsOpen, setToolsOpen] = useState(false)
  const [toolsCollapsed, setToolsCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [expandedCategory, setExpandedCategory] = useState<string | undefined>(undefined)
  const { serviceLine } = useServiceLine()

  // New state for protocol features
  const [viewMode, setViewMode] = useState<ViewMode>('study')
  const [showOutOfScope, setShowOutOfScope] = useState(false)
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({})
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null)
  const [darkMode, setDarkMode] = useState(false)

  // Initialize all sections as expanded
  useEffect(() => {
    if (protocol?.sections) {
      const expanded: Record<string, boolean> = {}
      protocol.sections.forEach((section, index) => {
        expanded[section.id || `section-${index}`] = true
      })
      setExpandedSections(expanded)
    }
  }, [protocol])

  // Check dark mode preference
  useEffect(() => {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    setDarkMode(isDark)
  }, [])

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
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [sidebarOpen, toolsOpen, isMobile])

  const toggleToolsDrawer = () => {
    setToolsOpen((prev) => !prev)
  }

  const closeToolsDrawer = () => {
    setToolsOpen(false)
  }

  const handleCategoryClick = () => {
    if (protocol.category) {
      setExpandedCategory(protocol.category)
      setSidebarOpen(true)
      if (sidebarCollapsed) {
        setSidebarCollapsed(false)
      }
    }
  }

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }))
  }

  const toggleStep = (stepId: string) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [stepId]: !prev[stepId],
    }))
  }

  const handleProtocolNavigation = (code: string) => {
    // Find protocol by code
    const targetProtocol = allProtocols.find((p) => p.code === code)
    if (targetProtocol) {
      window.location.href = `/protocols/${targetProtocol.code}`
    } else {
      alert(`Protocol ${code} not found`)
    }
  }

  const sections = protocol.sections as unknown as ProtocolSection[] | undefined

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
              <button
                onClick={handleCategoryClick}
                className="capitalize hover:text-neutral-900 dark:hover:text-neutral-100 cursor-pointer"
              >
                {protocol.category.replace(/-/g, ' ')}
              </button>
              <ChevronRight className="h-3 w-3" />
            </>
          )}
          <span className="font-medium text-neutral-900 dark:text-neutral-100">
            {protocol.title}
          </span>
        </div>
      </div>

      {/* 3-Column Layout */}
      <div className="flex-1 flex overflow-hidden relative bg-white dark:bg-neutral-800">
        {/* Left Sidebar - Protocol Tree */}
        <ProtocolTree
          protocols={allProtocols}
          currentProtocolNumber={protocol.code || ''}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          expandedCategory={expandedCategory}
          onCategoryExpanded={() => setExpandedCategory(undefined)}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-neutral-50 dark:bg-neutral-900">
          <div className="px-4 md:px-6 py-6 max-w-4xl mx-auto">
            {/* Protocol Header */}
            <div className="mb-6">
              <div className="flex items-center gap-4 text-sm text-neutral-500 mb-2">
                {protocol.code && <span className="font-mono font-bold text-blue-600">{protocol.code}</span>}
                {protocol.lastModified && <span>Modified: {protocol.lastModified}</span>}
              </div>

              {/* Title and View Mode Toggle Row */}
              <div className="flex items-start justify-between gap-4 mb-2">
                <h1 className="text-3xl font-bold">{protocol.title}</h1>

                {/* View Mode Toggle - Top Right */}
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => setViewMode('study')}
                    className={`p-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-1.5 ${
                      viewMode === 'study'
                        ? 'bg-blue-600 text-white'
                        : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                    }`}
                    title="Study Mode"
                  >
                    <Book size={18} />
                    <span className="text-sm">Study</span>
                  </button>
                  <button
                    onClick={() => setViewMode('active')}
                    className={`p-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-1.5 ${
                      viewMode === 'active'
                        ? 'bg-red-600 text-white'
                        : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                    }`}
                    title="Active Mode"
                  >
                    <Activity size={18} />
                    <span className="text-sm">Active</span>
                  </button>
                </div>
              </div>

              {protocol.subcategory && (
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                  {protocol.subcategory}
                </p>
              )}

              {/* Show Out of Scope checkbox - Below toggles */}
              {viewMode === 'active' && (
                <div className="flex justify-end">
                  <label className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                    <input
                      type="checkbox"
                      checked={showOutOfScope}
                      onChange={(e) => setShowOutOfScope(e.target.checked)}
                      className="rounded"
                    />
                    Show greyed out levels
                  </label>
                </div>
              )}
            </div>

            {/* Protocol Sections */}
            {sections && sections.length > 0 && (
              <div className="space-y-4">
                {sections.map((section, sectionIndex) => {
                  const sectionId = section.id || `section-${sectionIndex}`
                  const isExpanded = expandedSections[sectionId] ?? true

                  // Check if section is in scope
                  const sectionInScope = isInScope(section.scope, serviceLine as CertLevel)
                  if (viewMode === 'active' && !showOutOfScope && !sectionInScope) {
                    return null // Hide out-of-scope sections in active mode
                  }

                  return (
                    <div
                      key={sectionId}
                      className={`bg-white dark:bg-neutral-800 border dark:border-neutral-700 rounded-xl shadow-sm overflow-hidden ${
                        !sectionInScope && viewMode === 'active' ? 'opacity-40' : ''
                      }`}
                    >
                      {/* Section Header */}
                      <button
                        onClick={() => toggleSection(sectionId)}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors"
                      >
                        <h3 className="text-lg font-bold">{section.heading}</h3>
                        <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                          ▼
                        </span>
                      </button>

                      {/* Section Content */}
                      {isExpanded && (
                        <div className="px-4 pb-4">
                          {/* Section Note/Alert */}
                          {section.note && (
                            <div className="mb-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
                              <div className="flex gap-2">
                                <AlertCircle size={16} className="mt-0.5 flex-shrink-0 text-blue-600" />
                                <p className="text-sm">{section.note}</p>
                              </div>
                            </div>
                          )}

                          {/* Render based on content type */}
                          {section.contentType === 'bulletList' && section.bulletList && (
                            <div className="prose dark:prose-invert max-w-none">
                              <RichTextContent
                                content={section.bulletList}
                                showBadges={false}
                                serviceLine={serviceLine as CertLevel}
                              />
                            </div>
                          )}

                          {section.contentType === 'richText' && section.richText && (
                            <div className="prose dark:prose-invert max-w-none">
                              <RichTextContent
                                content={section.richText}
                                showBadges={false}
                                serviceLine={serviceLine as CertLevel}
                              />
                            </div>
                          )}

                          {section.contentType === 'actionSteps' && section.actionSteps && (
                            <div className="space-y-3">
                              {section.actionSteps
                                .filter((step) => {
                                  if (viewMode === 'study') return true
                                  if (showOutOfScope) return true
                                  return isInScope(step.scope, serviceLine as CertLevel)
                                })
                                .map((step, stepIndex) => {
                                  const stepId = `step-${sectionIndex}-${stepIndex}`
                                  const stepInScope = isInScope(step.scope, serviceLine as CertLevel)
                                  const scopeLabel = getScopeLabel(step.scope)
                                  const borderColor = getStepBorderColor(step.scope, darkMode)
                                  const badgeColor = getScopeBadgeColor(step.scope, serviceLine as CertLevel)

                                  return (
                                    <div
                                      key={stepId}
                                      className={`p-3 rounded-lg border-l-4 ${borderColor} bg-neutral-50 dark:bg-neutral-900/50 ${
                                        !stepInScope && viewMode === 'active' ? 'opacity-40' : ''
                                      }`}
                                    >
                                      {/* Step Header */}
                                      <div className="flex items-start gap-3 mb-2">
                                        {/* Checkbox for active mode */}
                                        {viewMode === 'active' && stepInScope && (
                                          <button
                                            onClick={() => toggleStep(stepId)}
                                            className="mt-1 flex-shrink-0"
                                          >
                                            {completedSteps[stepId] ? (
                                              <CheckSquare size={20} className="text-green-600" />
                                            ) : (
                                              <Square size={20} className="text-neutral-400" />
                                            )}
                                          </button>
                                        )}

                                        <div className="flex-1">
                                          {/* Badges Row */}
                                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            {/* Step number badge */}
                                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-neutral-700 text-white">
                                              #{step.stepNumber}
                                            </span>

                                            {/* Scope badge */}
                                            {scopeLabel && (
                                              <span className={`text-xs font-bold px-2 py-0.5 rounded ${badgeColor}`}>
                                                {scopeLabel}
                                              </span>
                                            )}

                                            {/* Out of scope warning */}
                                            {!stepInScope && viewMode === 'active' && (
                                              <span className="text-xs px-2 py-0.5 bg-yellow-600 text-white rounded font-bold">
                                                REQUIRES{' '}
                                                {step.scope?.filter((s) => s !== serviceLine as CertLevel).join('/') || 'HIGHER'}
                                              </span>
                                            )}

                                            {/* Medical Control badge */}
                                            {step.requiresMedControl && (
                                              <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-blue-600 text-white rounded font-bold">
                                                <Phone size={12} />
                                                MED CONTROL
                                              </span>
                                            )}

                                            {/* Timing badge */}
                                            {step.timing && (
                                              <span className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400 font-medium">
                                                <Clock size={12} />
                                                {step.timing}
                                              </span>
                                            )}
                                          </div>

                                          {/* Action text with clickable protocol codes */}
                                          <p className="font-medium">
                                            {renderActionWithLinks(step.action, handleProtocolNavigation)}
                                          </p>

                                          {/* Details */}
                                          {step.details && step.details.length > 0 && (
                                            <div className="ml-4 mt-2 space-y-1 text-sm text-neutral-600 dark:text-neutral-400">
                                              {step.details.map((detail, idx) => (
                                                <p key={idx}>• {detail.detail}</p>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )
                                })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Medications Section */}
            {protocol.medications && Array.isArray(protocol.medications) && protocol.medications.length > 0 && (
              <div className="mt-6 bg-white dark:bg-neutral-800 border dark:border-neutral-700 rounded-xl p-4 shadow-sm">
                <h3 className="text-lg font-bold mb-3">Medications</h3>
                <div className="space-y-2">
                  {protocol.medications
                    .filter((med) => {
                      if (typeof med === 'number') return false
                      if (viewMode === 'study') return true
                      const medication = med as Medication
                      return isInScope(medication.scope as CertLevel[] | undefined, serviceLine as CertLevel)
                    })
                    .map((med) => {
                      if (typeof med === 'number') return null
                      const medication = med as Medication
                      const scopeLabel = getScopeLabel(medication.scope as CertLevel[] | undefined)

                      return (
                        <button
                          key={medication.id}
                          onClick={() => setSelectedMedication(medication)}
                          className="w-full text-left p-3 rounded-lg border dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
                                  {medication.name}
                                </span>
                                {scopeLabel && (
                                  <span
                                    className={`text-xs px-2 py-0.5 rounded ${getScopeBadgeColor(medication.scope as CertLevel[] | undefined, serviceLine as CertLevel)}`}
                                  >
                                    {scopeLabel}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-neutral-600 dark:text-neutral-400">{medication.class}</p>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                </div>
              </div>
            )}

            {/* Related Protocols */}
            {protocol.relatedProtocols && Array.isArray(protocol.relatedProtocols) && protocol.relatedProtocols.length > 0 && (
              <div className="mt-6 bg-white dark:bg-neutral-800 border dark:border-neutral-700 rounded-xl p-4 shadow-sm">
                <h3 className="text-lg font-bold mb-3">Related Protocols</h3>
                <div className="flex flex-wrap gap-2">
                  {protocol.relatedProtocols.map((related) => {
                    if (typeof related === 'number') return null
                    const relatedProtocol = related as Protocol
                    return (
                      <button
                        key={relatedProtocol.id}
                        onClick={() => handleProtocolNavigation(relatedProtocol.code || '')}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        {relatedProtocol.code} - {relatedProtocol.title}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Version Info */}
            {(protocol.lastReviewed || protocol.effectiveDate) && (
              <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-neutral-500">
                {protocol.effectiveDate && (
                  <span>Effective: {new Date(protocol.effectiveDate).toLocaleDateString()}</span>
                )}
                {protocol.lastReviewed && (
                  <span>Last Reviewed: {new Date(protocol.lastReviewed).toLocaleDateString()}</span>
                )}
              </div>
            )}
          </div>
        </main>

        {/* Right Sidebar - Tools */}
        <ProtocolTools
          isOpen={toolsOpen}
          onToggleDrawer={toggleToolsDrawer}
          onRequestClose={closeToolsDrawer}
          isCollapsed={toolsCollapsed}
          onToggleCollapse={() => setToolsCollapsed(!toolsCollapsed)}
        />

        {/* Backdrop for mobile */}
        {((sidebarOpen && isMobile) || toolsOpen) && (
          <div
            className="fixed inset-0 bg-black/50 z-30"
            onClick={() => {
              if (isMobile) setSidebarOpen(false)
              closeToolsDrawer()
            }}
          />
        )}
      </div>

      {/* Medication Modal - TODO: Create separate component */}
      {selectedMedication && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b dark:border-neutral-700">
              <h2 className="text-xl font-bold">{selectedMedication.name}</h2>
              <button
                onClick={() => setSelectedMedication(null)}
                className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded"
              >
                ✕
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-60px)]">
              <p className="text-neutral-600 dark:text-neutral-400">
                Medication details coming soon...
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
