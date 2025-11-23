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
 * Flatten all scopes attached to medication indication routes
 */
function getMedicationScopes(medication: Medication): CertLevel[] {
  const scopes = new Set<CertLevel>()
  medication.medicationIndications?.forEach((indication) => {
    indication?.routes?.forEach((route) => {
      route?.scope?.forEach((routeScope) => {
        if (routeScope === 'BLS' || routeScope === 'ALS' || routeScope === 'CCT') {
          scopes.add(routeScope)
        }
      })
    })
  })
  return Array.from(scopes)
}

function getMedicationClassLabel(medication: Medication): string | null {
  const classRelation = medication.class
  if (!classRelation) return null
  if (typeof classRelation === 'string') {
    return classRelation
  }
  if (typeof classRelation === 'number') {
    return null
  }
  if (typeof classRelation === 'object') {
    if ('name' in classRelation && typeof classRelation.name === 'string' && classRelation.name.trim().length > 0) {
      return classRelation.name
    }
    if ('slug' in classRelation && typeof classRelation.slug === 'string' && classRelation.slug.trim().length > 0) {
      return classRelation.slug
    }
  }
  return null
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
  const activateMedicationCard = (medication: Medication) => setSelectedMedication(medication)
  const handleMedicationKeyDown = (event: React.KeyboardEvent<HTMLDivElement>, medication: Medication) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      activateMedicationCard(medication)
    }
  }

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
    const medicationEntries = (Array.isArray(protocol.medications) ? protocol.medications : []) as Array<
      number | Medication
    >
    const filteredMedications = medicationEntries.filter((med) => {
      if (typeof med === 'number') return false
      if (viewMode === 'study') return true
      const medication = med as Medication
      const medicationScopes = getMedicationScopes(medication)
      if (medicationScopes.length === 0) return true
      return isInScope(medicationScopes, serviceLine as CertLevel)
    })

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

              {/* Show Out of Scope toggle - Reserve space to prevent layout shift */}
              <div className="flex justify-end min-h-[32px] mb-2">
                {viewMode === 'active' && (
                  <button
                    onClick={() => setShowOutOfScope(!showOutOfScope)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                      showOutOfScope
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-2 border-blue-400 dark:border-blue-600'
                        : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 border-2 border-transparent hover:border-neutral-300 dark:hover:border-neutral-600'
                    }`}
                  >
                    <div
                      className={`w-9 h-5 rounded-full transition-colors duration-200 relative ${
                        showOutOfScope ? 'bg-blue-500' : 'bg-neutral-400 dark:bg-neutral-500'
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                          showOutOfScope ? 'translate-x-4' : 'translate-x-0.5'
                        }`}
                      />
                    </div>
                    <span>Show greyed out levels</span>
                  </button>
                )}
              </div>
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
              {medicationEntries.length > 0 && (
                <div className="mt-6 bg-white dark:bg-neutral-800 border dark:border-neutral-700 rounded-xl p-4 shadow-sm">
                  <h3 className="text-lg font-bold mb-3">Medications</h3>
                  <div className="space-y-2">
                      {filteredMedications.length > 0 ? (
                        filteredMedications.map((med) => {
                          if (typeof med === 'number') return null
                          const medication = med as Medication
                          const medicationScopes = getMedicationScopes(medication)
                          const scopeLabel = getScopeLabel(medicationScopes)
                          const medicationClassLabel = getMedicationClassLabel(medication)

                          return (
                            <div
                              key={medication.id}
                              role="button"
                              tabIndex={0}
                              aria-label={`Open ${medication.name} medication details`}
                              onClick={() => activateMedicationCard(medication)}
                              onKeyDown={(event) => handleMedicationKeyDown(event, medication)}
                              className="w-full text-left p-3 rounded-lg border dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-[0.99]"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
                                      {medication.name}
                                    </span>
                                    {scopeLabel && (
                                      <span
                                        className={`text-xs px-2 py-0.5 rounded ${getScopeBadgeColor(
                                          medicationScopes,
                                          serviceLine as CertLevel,
                                        )}`}
                                      >
                                        {scopeLabel}
                                      </span>
                                    )}
                                  </div>
                                  {medicationClassLabel && (
                                    <p className="text-sm text-neutral-600 dark:text-neutral-400">{medicationClassLabel}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })
                      ) : (
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 italic">
                        No medications available at the {serviceLine ?? 'selected'} level for this protocol.
                      </p>
                    )}
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
              <div className="p-4 overflow-y-auto max-h-[calc(90vh-60px)] space-y-4">
                <div className="flex flex-col gap-2 border dark:border-neutral-700 rounded-lg p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        {getMedicationClassLabel(selectedMedication) && (
                          <p className="text-sm uppercase text-neutral-500">
                            {getMedicationClassLabel(selectedMedication)}
                          </p>
                        )}
                      {selectedMedication.genericName && (
                        <p className="text-neutral-900 dark:text-neutral-100 font-medium">
                          Generic: {selectedMedication.genericName}
                        </p>
                      )}
                    </div>
                    {(() => {
                      const scopes = getMedicationScopes(selectedMedication)
                      const scopeLabel = getScopeLabel(scopes)
                      return scopeLabel ? (
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded ${getScopeBadgeColor(scopes, serviceLine as CertLevel)}`}
                        >
                          {scopeLabel}
                        </span>
                      ) : null
                    })()}
                  </div>
                  <p className="text-xs text-neutral-500">
                    Dosing varies by indication. Select the row below that matches the patient presentation and service scope.
                  </p>
                </div>

                {selectedMedication.medicationIndications && selectedMedication.medicationIndications.length > 0 ? (
                  <div className="space-y-5">
                    {selectedMedication.medicationIndications.map((indication) => (
                      <div
                        key={indication?.id || indication?.indication}
                        className="border dark:border-neutral-700 rounded-lg p-3 bg-neutral-50 dark:bg-neutral-900/40"
                      >
                        <div className="flex flex-col gap-1 mb-3">
                          <h3 className="text-lg font-semibold">{indication.indication}</h3>
                          {indication.clinicalContext && (
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">{indication.clinicalContext}</p>
                          )}
                        </div>
                        <div className="space-y-3">
                          {indication.routes?.map((route) => {
                            const routeScope = route.scope as CertLevel[] | undefined
                            const routeInScope = isInScope(routeScope, serviceLine as CertLevel)
                            const routeScopeLabel = getScopeLabel(routeScope)
                            const routeDetails = [
                              { label: 'Adult Dose', value: route.adultDose },
                              { label: 'Pediatric Dose', value: route.pediatricDose },
                              { label: 'Concentration', value: route.concentration },
                              { label: 'Interval', value: route.interval },
                              { label: 'Max Dose', value: route.maxDose },
                              { label: 'Rate', value: route.rate },
                              { label: 'Titration Goal', value: route.titrationGoal },
                            ].filter((detail) => detail.value)

                            return (
                              <div
                                key={route?.id || `${route.route}-${route.adultDose}`}
                                className={`rounded-lg border dark:border-neutral-700 p-3 ${!routeInScope ? 'opacity-70' : ''}`}
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                  <div>
                                    <p className="font-semibold">{route.route || 'Route'}</p>
                                    {route.notes && (
                                      <p className="text-sm text-neutral-600 dark:text-neutral-400">{route.notes}</p>
                                    )}
                                  </div>
                                  <div className="flex gap-2 flex-wrap">
                                    {routeScopeLabel && (
                                      <span
                                        className={`text-xs font-bold px-2 py-0.5 rounded ${getScopeBadgeColor(routeScope, serviceLine as CertLevel)}`}
                                      >
                                        {routeScopeLabel}
                                      </span>
                                    )}
                                    {!routeInScope && (
                                      <span className="text-xs px-2 py-0.5 rounded bg-yellow-600 text-white font-bold">
                                        Higher certification needed
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {routeDetails.length > 0 && (
                                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                    {routeDetails.map((detail) => (
                                      <div key={`${route.route}-${detail.label}`}>
                                        <dt className="text-neutral-500">{detail.label}</dt>
                                        <dd className="font-medium text-neutral-900 dark:text-neutral-100">{detail.value}</dd>
                                      </div>
                                    ))}
                                  </dl>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-neutral-600 dark:text-neutral-400">No indication-based dosing has been configured yet.</p>
                )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
