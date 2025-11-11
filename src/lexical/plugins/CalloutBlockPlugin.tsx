'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import type { LexicalEditor } from 'lexical'
import { $createParagraphNode, $createTextNode } from 'lexical'
import { $insertNodeToNearestRoot } from '@lexical/utils'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSquarePlus } from '@fortawesome/free-solid-svg-icons'
import type { ToolbarGroupItem } from '@payloadcms/richtext-lexical'
import { $createCalloutBlockNode, CalloutBlockNode } from '../nodes/CalloutBlockNode'
import { CALLOUT_PRESETS, type CalloutPresetId } from '@/lib/calloutPresets'

/**
 * Plugin component (registers with Lexical)
 */
export function CalloutBlockPlugin(): null {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    if (!editor.hasNodes([CalloutBlockNode])) {
      throw new Error('CalloutBlockPlugin: CalloutBlockNode not registered on editor')
    }
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

const dropdownContainerStyle: React.CSSProperties = {
  position: 'absolute',
  top: '100%',
  left: 0,
  marginTop: '4px',
  backgroundColor: 'white',
  border: '1px solid #ccc',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  zIndex: 1000,
  minWidth: '220px',
  maxHeight: '400px',
  overflowY: 'auto',
}

/**
 * Toolbar dropdown component for inserting callout blocks
 */
export function CalloutBlockToolbarDropdown({ editor }: ToolbarItemComponentProps): React.JSX.Element {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const dropdownRef = useRef<HTMLDivElement | null>(null)

  const insertCalloutBlock = useCallback(
    (presetId: CalloutPresetId) => {
      editor.update(() => {
        const calloutBlock = $createCalloutBlockNode(presetId)

        const paragraph = $createParagraphNode()
        const text = $createTextNode('Add your content here...')
        paragraph.append(text)
        calloutBlock.append(paragraph)

        $insertNodeToNearestRoot(calloutBlock)
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
        onClick={() => setIsDropdownOpen((prev) => !prev)}
        className="toolbar-item"
        aria-label="Insert callout"
        title="Insert callout block"
      >
        <FontAwesomeIcon icon={faSquarePlus} />
        <span className="text">Callout</span>
        <span className="chevron-down" style={{ marginLeft: '4px' }}>
          ▾
        </span>
      </button>

      {isDropdownOpen && (
        <div className="dropdown" ref={dropdownRef} style={dropdownContainerStyle}>
          {Object.values(CALLOUT_PRESETS).map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => insertCalloutBlock(preset.id as CalloutPresetId)}
              className="dropdown-item"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '10px 16px',
                border: 'none',
                background: 'transparent',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(event) => {
                event.currentTarget.style.backgroundColor = '#f3f4f6'
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <FontAwesomeIcon
                icon={preset.icon}
                style={{
                  color: preset.color,
                  width: '16px',
                  height: '16px',
                }}
              />
              <span style={{ flex: 1 }}>{preset.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
