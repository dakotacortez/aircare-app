'use client'

import type { LexicalEditor } from 'lexical'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $getSelection, $isRangeSelection, COMMAND_PRIORITY_EDITOR } from 'lexical'
import * as React from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ToolbarGroupItem } from '@payloadcms/richtext-lexical'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAward } from '@fortawesome/free-solid-svg-icons'
import { $createCertificationLevelNode } from '../nodes/CertificationLevelNode'
import { getAllCertLevels, type CertLevelKey } from '@/lib/certificationLevels'

/**
 * Plugin component that adds toolbar button for cert level tagging
 */
export function CertificationLevelPlugin(): null {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    // Plugin is registered, no-op for now
    return () => undefined
  }, [editor])

  return null
}

type ToolbarItemComponentProps = {
  active?: boolean
  anchorElem: HTMLElement
  editor: LexicalEditor
  enabled?: boolean
  item: ToolbarGroupItem
}

const dropdownStyles: React.CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 4px)',
  left: 0,
  zIndex: 1000,
  backgroundColor: 'white',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  minWidth: '220px',
  padding: '4px',
}

const buttonStyles: React.CSSProperties = {
  padding: '6px 12px',
  border: '1px solid #d1d5db',
  borderRadius: '4px',
  fontSize: '14px',
  fontWeight: 500,
}

const dropdownButtonStyles: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 12px',
  border: 'none',
  backgroundColor: 'transparent',
  cursor: 'pointer',
  fontSize: '14px',
  textAlign: 'left',
  borderRadius: '4px',
  transition: 'background-color 0.15s',
}

/**
 * Toolbar dropdown component for cert level tagging
 */
export function CertificationLevelToolbarDropdown({ editor: editorProp }: ToolbarItemComponentProps): React.JSX.Element {
  // Use context as fallback if editor prop isn't available
  const [editorFromContext] = useLexicalComposerContext()
  const editor = editorProp || editorFromContext

  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isTextSelected, setIsTextSelected] = useState(false)
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const dropdownRef = useRef<HTMLDivElement | null>(null)
  const certLevels = useMemo(() => getAllCertLevels(), [])

  // Check initial selection state
  useEffect(() => {
    if (!editor) return

    editor.getEditorState().read(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        const text = selection.getTextContent()
        setIsTextSelected(text.length > 0)
      }
    })
  }, [editor])

  useEffect(() => {
    if (!editor) return

    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection)) {
          const text = selection.getTextContent()
          setIsTextSelected(text.length > 0)
        } else {
          setIsTextSelected(false)
        }
      })
    })
  }, [editor])

  const handleWrapSelection = useCallback(
    (certLevel: CertLevelKey) => {
      editor.update(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection)) {
          const selectedText = selection.getTextContent()
          if (selectedText.length > 0) {
            const node = $createCertificationLevelNode(certLevel, selectedText)
            selection.insertNodes([node])
          }
        }
      })
      setIsDropdownOpen(false)
    },
    [editor],
  )

  useEffect(() => {
    if (!isDropdownOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null
      if (!target) return

      if (dropdownRef.current?.contains(target) || buttonRef.current?.contains(target)) {
        return
      }

      setIsDropdownOpen(false)
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [isDropdownOpen])

  return (
    <div className="relative" onClick={(event) => event.stopPropagation()}>
      <button
        ref={buttonRef}
        type="button"
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          if (isTextSelected) {
            setIsDropdownOpen((prev) => !prev)
          }
        }}
        disabled={!isTextSelected}
        className="toolbar-item"
        aria-label="Tag certification level"
        title="Tag certification level"
        style={{
          ...buttonStyles,
          backgroundColor: isTextSelected ? '#ffffff' : '#f3f4f6',
          cursor: isTextSelected ? 'pointer' : 'not-allowed',
          opacity: isTextSelected ? 1 : 0.5,
        }}
      >
        <FontAwesomeIcon icon={faAward} />
        <span className="text">Cert Level</span>
        <span className="chevron-down" style={{ marginLeft: '4px' }}>
          ▾
        </span>
      </button>

      {isDropdownOpen && isTextSelected && (
        <div ref={dropdownRef} className="cert-level-dropdown" style={dropdownStyles}>
          {certLevels.map((cert) => (
            <button
              key={cert.value}
              type="button"
              onClick={() => handleWrapSelection(cert.value as CertLevelKey)}
              style={dropdownButtonStyles}
              onMouseEnter={(event) => {
                event.currentTarget.style.backgroundColor = '#f3f4f6'
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: '12px',
                  height: '12px',
                  borderRadius: '3px',
                  backgroundColor: cert.color,
                }}
              />
              <span style={{ flex: 1, fontWeight: 500 }}>{cert.label}</span>
              <span style={{ fontSize: '12px', color: '#6b7280' }}>Level {cert.level}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Command to programmatically wrap text with cert level
 * Can be used by other plugins or keyboard shortcuts
 */
export const INSERT_CERTIFICATION_LEVEL_COMMAND = 'INSERT_CERTIFICATION_LEVEL_COMMAND'

export function useCertificationLevelCommands(): void {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return editor.registerCommand(
      INSERT_CERTIFICATION_LEVEL_COMMAND as any,
      (payload: { certLevel: CertLevelKey; text: string }) => {
        editor.update(() => {
          const selection = $getSelection()
          if ($isRangeSelection(selection)) {
            const node = $createCertificationLevelNode(payload.certLevel, payload.text)
            selection.insertNodes([node])
          }
        })
        return true
      },
      COMMAND_PRIORITY_EDITOR,
    )
  }, [editor])
}
