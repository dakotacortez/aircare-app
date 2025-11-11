'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { ChevronRight, FolderTree, X } from 'lucide-react'
import { Protocol } from '@/payload-types'

interface ProtocolTreeProps {
  protocols: Protocol[]
  currentProtocolNumber?: string
  isOpen: boolean
  onClose: () => void
}

export function ProtocolTree({ protocols, currentProtocolNumber, isOpen, onClose }: ProtocolTreeProps) {
  // Group protocols by category and subcategory
  const tree: Record<string, Record<string, Protocol[]>> = {}
  
  protocols.forEach((protocol) => {
    const category = protocol.category || 'Uncategorized'
    const subcategory = protocol.subcategory || 'General'
    
    if (!tree[category]) tree[category] = {}
    if (!tree[category][subcategory]) tree[category][subcategory] = []
    tree[category][subcategory].push(protocol)
  })

  return (
    <aside className={`fixed md:relative z-40 w-80 md:w-[320px] h-full bg-white dark:bg-neutral-800 border-r dark:border-neutral-700 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} overflow-auto`}>
      <div className="px-4 py-3 flex items-center gap-2 sticky top-0 bg-white dark:bg-neutral-800 border-b dark:border-neutral-700 z-10">
        <FolderTree className="h-4 w-4" />
        <div className="text-sm font-medium flex-1">Browse Protocols</div>
        <button
          onClick={onClose}
          className="rounded-lg p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      
      <nav className="p-2 text-sm">
        {Object.entries(tree).sort().map(([category, subcategories]) => (
          <TreeCategory
            key={category}
            label={category.replace(/-/g, ' ')}
            subcategories={subcategories}
            currentProtocolNumber={currentProtocolNumber}
          />
        ))}
      </nav>
    </aside>
  )
}

function TreeCategory({
  label,
  subcategories,
  currentProtocolNumber
}: {
  label: string
  subcategories: Record<string, Protocol[]>
  currentProtocolNumber?: string
}) {
  // Check if this category contains the active protocol in any subcategory
  const containsActiveProtocol = Object.values(subcategories).some((protocols) =>
    protocols.some((protocol) => protocol.protocolNumber === currentProtocolNumber)
  )
  const [open, setOpen] = useState(containsActiveProtocol || !currentProtocolNumber)

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800"
      >
        <ChevronRight className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-90' : ''}`} />
        <span className="font-medium capitalize">{label}</span>
      </button>

      {open && (
        <div className="pl-5 space-y-0.5">
          {Object.entries(subcategories).sort().map(([subcategory, protocols]) => (
            <TreeSubcategory
              key={subcategory}
              label={subcategory}
              protocols={protocols}
              currentProtocolNumber={currentProtocolNumber}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function TreeSubcategory({
  label,
  protocols,
  currentProtocolNumber
}: {
  label: string
  protocols: Protocol[]
  currentProtocolNumber?: string
}) {
  // Check if this subcategory contains the active protocol
  const containsActiveProtocol = protocols.some(
    (protocol) => protocol.protocolNumber === currentProtocolNumber
  )
  const [open, setOpen] = useState(containsActiveProtocol)

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800"
      >
        <ChevronRight className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-90' : ''}`} />
        <span className="text-sm">{label}</span>
      </button>

      {open && (
        <div className="pl-5 space-y-0.5">
          {protocols.map((protocol) => {
            const isActive = protocol.protocolNumber === currentProtocolNumber
            return (
              <Link
                key={protocol.id}
                href={`/protocols/${protocol.protocolNumber}`}
                className={`flex items-center gap-2 px-8 py-1.5 rounded-lg cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 ${
                  isActive ? 'bg-neutral-100 dark:bg-neutral-700 border-l-4 border-neutral-900 dark:border-neutral-100' : ''
                }`}
              >
                <span className={isActive ? 'font-semibold text-sm' : 'text-sm'}>{protocol.title}</span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
