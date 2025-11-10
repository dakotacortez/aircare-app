/**
 * Lexical plugin that adds certification level toolbar button
 * Allows users to wrap selected text with cert level tags
 */

'use client'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $getSelection, $isRangeSelection, COMMAND_PRIORITY_EDITOR } from 'lexical'
import * as React from 'react'
import { useCallback, useEffect, useState } from 'react'
import { $createCertificationLevelNode } from '../nodes/CertificationLevelNode'
import { getAllCertLevels, type CertLevelKey } from '@/lib/certificationLevels'

/**
 * Plugin component that adds toolbar button for cert level tagging
 */
export function CertificationLevelPlugin(): null {
  const [editor] = useLexicalComposerContext()

  // This plugin doesn't track state - the toolbar button handles selection state
  // It's registered here to ensure it's loaded with the editor
  useEffect(() => {
    // Plugin is registered, no-op for now
  }, [editor])

  return null // This plugin doesn't render anything directly
}

/**
 * Toolbar button component for cert level tagging
 * This should be registered in the Lexical toolbar configuration
 */
export function CertificationLevelToolbarButton(): React.JSX.Element {
  const [editor] = useLexicalComposerContext()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isTextSelected, setIsTextSelected] = useState(false)

  // Track selection state
  useEffect(() => {
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

  const certLevels = getAllCertLevels()

  return (
    <div className="cert-level-toolbar-button" style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        disabled={!isTextSelected}
        className="toolbar-button"
        title="Tag certification level"
        style={{
          padding: '6px 12px',
          border: '1px solid #d1d5db',
          borderRadius: '4px',
          backgroundColor: isTextSelected ? '#ffffff' : '#f3f4f6',
          cursor: isTextSelected ? 'pointer' : 'not-allowed',
          fontSize: '14px',
          fontWeight: 500,
          opacity: isTextSelected ? 1 : 0.5,
        }}
      >
        🏥 Cert Level
      </button>

      {isDropdownOpen && isTextSelected && (
        <div
          className="cert-level-dropdown"
          style={{
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
          }}
        >
          {certLevels.map((cert) => (
            <button
              key={cert.value}
              type="button"
              onClick={() => handleWrapSelection(cert.value as CertLevelKey)}
              style={{
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
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
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

      {/* Click outside to close dropdown */}
      {isDropdownOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999,
          }}
          onClick={() => setIsDropdownOpen(false)}
        />
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
