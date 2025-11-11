'use client'

import type { PayloadAdminBarProps, PayloadMeUser } from '@payloadcms/admin-bar'
import type { User } from '@/payload-types'

import { cn } from '@/utilities/ui'
import { useSelectedLayoutSegments } from 'next/navigation'
import { PayloadAdminBar } from '@payloadcms/admin-bar'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

import './index.scss'

import { getClientSideURL } from '@/utilities/getURL'

const baseClass = 'admin-bar'

const collectionLabels = {
  pages: {
    plural: 'Pages',
    singular: 'Page',
  },
  posts: {
    plural: 'Posts',
    singular: 'Post',
  },
  projects: {
    plural: 'Projects',
    singular: 'Project',
  },
}

const Title: React.FC = () => <span>Dashboard</span>

// Format role for display
const formatRole = (role: User['role']): string => {
  if (role === 'admin-team') return 'Admin Team'
  if (role === 'content-team') return 'Content Team'
  return 'User'
}

export const AdminBar: React.FC<{
  adminBarProps?: PayloadAdminBarProps
}> = (props) => {
  const { adminBarProps } = props || {}
  const segments = useSelectedLayoutSegments()
  const [show, setShow] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const collection = (
    collectionLabels[segments?.[1] as keyof typeof collectionLabels] ? segments[1] : 'pages'
  ) as keyof typeof collectionLabels
  const router = useRouter()

  // Check auth status and fetch full user data on mount
  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`${getClientSideURL()}/api/users/me`, {
          credentials: 'include',
        })
        if (res.ok) {
          const data = await res.json()
          if (data?.user?.id) {
            setShow(true)
            setUser(data.user)
          }
        }
      } catch {
        setShow(false)
        setUser(null)
      }
    }
    checkAuth()
  }, [])

  const onAuthChange = React.useCallback((payloadUser: PayloadMeUser) => {
    const hasUser = Boolean(payloadUser?.id)
    setShow(hasUser)
    if (!hasUser) {
      setUser(null)
    }
  }, [])

  return (
    <div
      className={cn(baseClass, 'py-2 bg-black text-white', {
        block: show,
        hidden: !show,
      })}
    >
      <div className="container">
        <div className="flex items-center gap-4">
          {/* Left section: Dashboard and User email */}
          <PayloadAdminBar
            {...adminBarProps}
            className="flex-1"
            classNames={{
              controls: 'font-medium text-white',
              logo: 'text-white',
              user: 'text-white',
            }}
            cmsURL={getClientSideURL()}
            collectionSlug={collection}
            collectionLabels={{
              plural: collectionLabels[collection]?.plural || 'Pages',
              singular: collectionLabels[collection]?.singular || 'Page',
            }}
            logo={<Title />}
            onAuthChange={onAuthChange}
            onPreviewExit={() => {
              fetch('/next/exit-preview').then(() => {
                router.push('/')
                router.refresh()
              })
            }}
            // Hide the "Create/New Page" button
            createProps={{
              style: { display: 'none' },
            }}
            style={{
              backgroundColor: 'transparent',
              padding: 0,
              position: 'relative',
              zIndex: 'unset',
            }}
          />
          {/* Right section: User role badge */}
          {user && (
            <div className="text-sm font-medium text-white/80 whitespace-nowrap">
              {formatRole(user.role)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
