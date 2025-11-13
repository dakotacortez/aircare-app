'use client'

import './CalloutBlockPlugin.css'

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $createParagraphNode,
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  $isRangeSelection,
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_LOW,
  LexicalEditor,
} from 'lexical'
import { $insertNodeToNearestRoot } from '@lexical/utils'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSquarePlus } from '@fortawesome/free-solid-svg-icons'
import type { ToolbarGroupItem } from '@payloadcms/richtext-lexical'
import {
  CALL_OUT_ICON_OPTIONS,
  CALLOUT_PRESETS,
  type CalloutIconId,
  type CalloutPresetId,
  type CalloutVariant,
  getCalloutPreset,
} from '@/lib/calloutPresets'
import {
  $createCalloutBlockNode,
  $isCalloutBlockNode,
  CalloutBlockNode,
} from '../nodes/CalloutBlockNode'

type CalloutSettings = {
  presetId?: CalloutPresetId
  label: string
  icon: CalloutIconId
  color: string
  variant: CalloutVariant
}

type ModalContext =
  | {
      mode: 'create'
    }
  | {
      mode: 'edit'
      nodeKey: string
    }
  | null

type ToolbarItemComponentProps = {
  active?: boolean
  anchorElem: HTMLElement
  editor: LexicalEditor
  enabled?: boolean
  item: ToolbarGroupItem
}

export function CalloutBlockPlugin(): null {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    if (!editor.hasNodes([CalloutBlockNode])) {
      throw new Error('CalloutBlockPlugin: CalloutBlockNode not registered on editor')
    }
  }, [editor])

  return null
}

const dropdownContainerStyle: React.CSSProperties = {
  position: 'absolute',
  top: '100%',
  left: 0,
  marginTop: '4px',
  backgroundColor: 'var(--theme-elevation-50, #fff)',
  border: '1px solid var(--theme-elevation-150, #d1d5db)',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  zIndex: 1000,
  minWidth: '240px',
  maxHeight: '420px',
  overflowY: 'auto',
}

const dropdownItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '12px',
  width: '100%',
  padding: '10px 16px',
  border: 'none',
  background: 'transparent',
  textAlign: 'left',
  cursor: 'pointer',
  fontSize: '14px',
  transition: 'background-color 0.15s ease',
}

const calloutPreviewStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
}

export function CalloutBlockToolbarDropdown({ editor }: ToolbarItemComponentProps): React.JSX.Element {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalContext, setModalContext] = useState<ModalContext>(null)
  const [modalInitialSettings, setModalInitialSettings] = useState<CalloutSettings | null>(null)
  const [selectedCalloutKey, setSelectedCalloutKey] = useState<string | null>(null)
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const dropdownRef = useRef<HTMLDivElement | null>(null)

  const insertCalloutBlock = useCallback(
    (settings: CalloutSettings) => {
      editor.update(() => {
        const calloutBlock = $createCalloutBlockNode(settings)

        // Only add paragraph child for callouts, not alerts
        if (settings.variant === 'callout') {
          const paragraph = $createParagraphNode()
          calloutBlock.append(paragraph)
          $insertNodeToNearestRoot(calloutBlock)
          paragraph.select()
        } else {
          // Alerts have no body content
          $insertNodeToNearestRoot(calloutBlock)
        }
      })
    },
    [editor],
  )

  const openModal = useCallback(
    (context: ModalContext, settings: CalloutSettings) => {
      setModalContext(context)
      setModalInitialSettings(settings)
      setIsModalOpen(true)
      setIsDropdownOpen(false)
    },
    [],
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

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        editor.getEditorState().read(() => {
          const selection = $getSelection()

          if ($isRangeSelection(selection)) {
            const nodes = [selection.anchor.getNode(), selection.focus.getNode()]

            for (const node of nodes) {
              if (!node) continue
              const topLevel = node.getTopLevelElementOrThrow()
              if ($isCalloutBlockNode(topLevel)) {
                setSelectedCalloutKey(topLevel.getKey())
                return
              }
            }
          } else if ($isNodeSelection(selection)) {
            const nodes = selection.getNodes()
            for (const node of nodes) {
              if ($isCalloutBlockNode(node)) {
                setSelectedCalloutKey(node.getKey())
                return
              }

              const topLevel = node.getTopLevelElementOrThrow()
              if ($isCalloutBlockNode(topLevel)) {
                setSelectedCalloutKey(topLevel.getKey())
                return
              }
            }
          }

          setSelectedCalloutKey(null)
        })
        return false
      },
      COMMAND_PRIORITY_LOW,
    )
  }, [editor])

  const handlePresetInsert = useCallback(
    (presetId: CalloutPresetId) => {
      const preset = CALLOUT_PRESETS[presetId]
      if (!preset) return
      insertCalloutBlock({
        presetId,
        label: preset.label,
        icon: preset.icon,
        color: preset.color,
        variant: preset.variant,
      })
      setIsDropdownOpen(false)
    },
    [insertCalloutBlock],
  )

  const handleOpenCustom = useCallback(() => {
    openModal(
      { mode: 'create' },
      {
        presetId: undefined,
        label: 'Callout',
        icon: 'circle-info',
        color: '#0ea5e9',
        variant: 'callout',
      },
    )
  }, [openModal])

  const handleOpenEdit = useCallback(() => {
    if (!selectedCalloutKey) return

    editor.getEditorState().read(() => {
      const node = $getNodeByKey(selectedCalloutKey)
      if (!$isCalloutBlockNode(node)) return

      const presetId = node.getPresetId()
      openModal(
        { mode: 'edit', nodeKey: selectedCalloutKey },
        {
          presetId,
          label: node.getLabel(),
          icon: node.getIcon(),
          color: node.getColor(),
          variant: node.getVariant(),
        },
      )
    })
  }, [editor, openModal, selectedCalloutKey])

  const handleModalSave = useCallback(
    (settings: CalloutSettings) => {
      if (!modalContext) return

      if (modalContext.mode === 'create') {
        insertCalloutBlock(settings)
      }

      if (modalContext.mode === 'edit') {
        editor.update(() => {
          const node = $getNodeByKey(modalContext.nodeKey)
          if ($isCalloutBlockNode(node)) {
            node.setPreset(settings.presetId)
            node.setLabel(settings.label)
            node.setIcon(settings.icon)
            node.setColor(settings.color)
            node.setVariant(settings.variant)
          }
        })
      }

      setIsModalOpen(false)
      setModalContext(null)
      setModalInitialSettings(null)
    },
    [editor, insertCalloutBlock, modalContext],
  )

  const quickTypeOptions = useMemo(
    () => [
      {
        id: 'alert' as const,
        label: 'Alert',
        description: 'Red, attention grabbing layout for critical warnings.',
        icon: 'triangle-exclamation' as CalloutIconId,
        color: '#ef4444',
        variant: 'alert' as CalloutVariant,
      },
      {
        id: 'callout' as const,
        label: 'Callout',
        description: 'Standard informational callout with accent border.',
        icon: 'circle-info' as CalloutIconId,
        color: '#0ea5e9',
        variant: 'callout' as CalloutVariant,
      },
    ],
    [],
  )

  const dropdownSections = useMemo(
    () =>
      [
        {
          id: 'alerts',
          title: 'Alert presets',
          presets: [
            CALLOUT_PRESETS.medicalControl,
            CALLOUT_PRESETS.physicianOnly,
            CALLOUT_PRESETS.highRisk,
          ],
        },
        {
          id: 'callouts',
          title: 'Callout presets',
          presets: [
            CALLOUT_PRESETS.information,
            CALLOUT_PRESETS.medication,
            CALLOUT_PRESETS.tip,
            CALLOUT_PRESETS.notification,
          ],
        },
      ].filter((section) => section.presets.length > 0),
    [],
  )

  return (
    <div className="relative" onClick={(event) => event.stopPropagation()}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsDropdownOpen((prev) => !prev)}
        className="toolbar-item"
        aria-label="Insert callout"
        title="Insert callout"
      >
        <FontAwesomeIcon icon={faSquarePlus} />
        <span className="text">Callout</span>
        <span className="chevron-down" style={{ marginLeft: '4px' }}>
          ▾
        </span>
      </button>

      {isDropdownOpen && (
        <div className="dropdown" ref={dropdownRef} style={dropdownContainerStyle}>
          <div
            style={{
              padding: '12px 16px 6px 16px',
              fontSize: '12px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: 'var(--theme-elevation-500, #6b7280)',
            }}
          >
            Quick types
          </div>
          {quickTypeOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                insertCalloutBlock({
                  presetId: undefined,
                  label: option.label,
                  icon: option.icon,
                  color: option.color,
                  variant: option.variant,
                })
                setIsDropdownOpen(false)
              }}
              style={dropdownItemStyle}
              onMouseEnter={(event) => {
                event.currentTarget.style.backgroundColor = 'var(--theme-elevation-100, #f3f4f6)'
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <span
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '6px',
                  backgroundColor: option.color,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                {option.label.slice(0, 1)}
              </span>
              <span style={calloutPreviewStyle}>
                <span style={{ fontWeight: 600 }}>{option.label}</span>
                <span style={{ fontSize: '12px', color: 'var(--theme-elevation-600, #4b5563)' }}>
                  {option.description}
                </span>
              </span>
            </button>
          ))}

          <div style={{ borderTop: '1px solid var(--theme-elevation-150, #e5e7eb)', margin: '8px 0' }} />

          {dropdownSections.map((section, sectionIndex) => (
            <React.Fragment key={section.id}>
              <div
                style={{
                  padding: '8px 16px',
                  fontSize: '12px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: 'var(--theme-elevation-500, #6b7280)',
                }}
              >
                {section.title}
              </div>
              {section.presets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handlePresetInsert(preset.id as CalloutPresetId)}
                  style={dropdownItemStyle}
                  onMouseEnter={(event) => {
                    event.currentTarget.style.backgroundColor = 'var(--theme-elevation-100, #f3f4f6)'
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  <span
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '6px',
                      backgroundColor: preset.color,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: '12px',
                      fontWeight: 700,
                    }}
                  >
                    {preset.label.slice(0, 1)}
                  </span>
                  <span style={calloutPreviewStyle}>
                    <span style={{ fontWeight: 600 }}>{preset.label}</span>
                    {preset.description && (
                      <span style={{ fontSize: '12px', color: 'var(--theme-elevation-600, #4b5563)' }}>
                        {preset.description}
                      </span>
                    )}
                  </span>
                </button>
              ))}
              {sectionIndex < dropdownSections.length - 1 && (
                <div
                  style={{ borderTop: '1px solid var(--theme-elevation-150, #e5e7eb)', margin: '8px 0' }}
                />
              )}
            </React.Fragment>
          ))}

          <div style={{ borderTop: '1px solid var(--theme-elevation-150, #e5e7eb)', margin: '8px 0' }} />

          <button
            type="button"
            style={dropdownItemStyle}
            onClick={handleOpenCustom}
            onMouseEnter={(event) => {
              event.currentTarget.style.backgroundColor = 'var(--theme-elevation-100, #f3f4f6)'
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <span style={{ fontWeight: 600 }}>Custom callout…</span>
          </button>

          <button
            type="button"
            style={{
              ...dropdownItemStyle,
              opacity: selectedCalloutKey ? 1 : 0.45,
              cursor: selectedCalloutKey ? 'pointer' : 'not-allowed',
            }}
            disabled={!selectedCalloutKey}
            onClick={handleOpenEdit}
            onMouseEnter={(event) => {
              if (!event.currentTarget.disabled) {
                event.currentTarget.style.backgroundColor = 'var(--theme-elevation-100, #f3f4f6)'
              }
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <span style={{ fontWeight: 600 }}>Edit selected callout…</span>
          </button>
        </div>
      )}

      {isModalOpen && modalInitialSettings && (
        <CalloutSettingsModal
          initialSettings={modalInitialSettings}
          onClose={() => {
            setIsModalOpen(false)
            setModalContext(null)
            setModalInitialSettings(null)
          }}
          onSave={handleModalSave}
        />
      )}
    </div>
  )
}

type CalloutSettingsModalProps = {
  initialSettings: CalloutSettings
  onClose: () => void
  onSave: (settings: CalloutSettings) => void
}

function CalloutSettingsModal({ initialSettings, onClose, onSave }: CalloutSettingsModalProps) {
  const [presetId, setPresetId] = useState<string>(initialSettings.presetId ?? '')
  const [label, setLabel] = useState(initialSettings.label)
  const [iconId, setIconId] = useState<CalloutIconId>(initialSettings.icon)
  const [color, setColor] = useState(initialSettings.color)
  const [variant, setVariant] = useState<CalloutVariant>(initialSettings.variant)

  const modalRoot = typeof document !== 'undefined' ? document.body : null

  const presetOptions = useMemo(
    () => Object.values(CALLOUT_PRESETS).filter((preset) => preset.variant === variant),
    [variant],
  )

  const handlePresetChange = (value: string) => {
    setPresetId(value)
    if (value) {
      const preset = getCalloutPreset(value)
      if (preset) {
        setVariant(preset.variant)
        setLabel(preset.label)
        setIconId(preset.icon)
        setColor(preset.color)
      }
    }
  }

  const handleVariantChange = (value: CalloutVariant) => {
    setVariant(value)
    const preset = presetId ? getCalloutPreset(presetId) : undefined
    if (preset && preset.variant !== value) {
      setPresetId('')
    }

    if (!presetId) {
      if (value === 'alert') {
        if (label === 'Callout') {
          setLabel('Alert')
        }
        setIconId('triangle-exclamation')
        setColor('#ef4444')
      } else {
        if (label === 'Alert') {
          setLabel('Callout')
        }
        setIconId('circle-info')
        setColor('#0ea5e9')
      }
    }
  }

  const handleSave = () => {
    const safeLabel = label.trim() || 'Callout'
    const safeColor = color.startsWith('#') ? color : `#${color}`
    onSave({
      presetId: presetId ? (presetId as CalloutPresetId) : undefined,
      label: safeLabel,
      icon: iconId,
      color: safeColor,
      variant,
    })
  }

  if (!modalRoot) return null

  return createPortal(
    <div className="callout-modal-backdrop">
      <div className="callout-modal">
        <div className="callout-modal__header">
          <h3>Configure callout</h3>
          <button type="button" onClick={onClose} aria-label="Close callout settings">
            ×
          </button>
        </div>

        <div className="callout-modal__body">
          <label className="callout-modal__field">
            <span>Type</span>
            <div className="callout-modal__segmented">
              <button
                type="button"
                className={
                  'callout-modal__segmented-button' +
                  (variant === 'callout' ? ' callout-modal__segmented-button--active' : '')
                }
                onClick={() => handleVariantChange('callout')}
                aria-pressed={variant === 'callout'}
              >
                Callout
              </button>
              <button
                type="button"
                className={
                  'callout-modal__segmented-button' +
                  (variant === 'alert' ? ' callout-modal__segmented-button--active' : '')
                }
                onClick={() => handleVariantChange('alert')}
                aria-pressed={variant === 'alert'}
              >
                Alert
              </button>
            </div>
          </label>

          <label className="callout-modal__field">
            <span>Preset</span>
            <select value={presetId} onChange={(event) => handlePresetChange(event.target.value)}>
              <option value="">Custom</option>
              {presetOptions.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.label}
                </option>
              ))}
            </select>
          </label>

          <label className="callout-modal__field">
            <span>Label</span>
            <input
              type="text"
              value={label}
              placeholder="Callout title"
              onChange={(event) => setLabel(event.target.value)}
            />
          </label>

          <label className="callout-modal__field">
            <span>Primary color</span>
            <input type="color" value={color} onChange={(event) => setColor(event.target.value)} />
          </label>

          <label className="callout-modal__field">
            <span>Icon</span>
            <select
              value={iconId}
              onChange={(event) => setIconId(event.target.value as CalloutIconId)}
            >
              {CALL_OUT_ICON_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="callout-modal__footer">
          <button type="button" onClick={onClose} className="callout-modal__button callout-modal__button--ghost">
            Cancel
          </button>
          <button type="button" onClick={handleSave} className="callout-modal__button callout-modal__button--primary">
            Save
          </button>
        </div>
      </div>
    </div>,
    modalRoot,
  )
}

