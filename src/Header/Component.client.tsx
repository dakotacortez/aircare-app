'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { HeartPulse, Menu, Sun, Moon, Users } from 'lucide-react'

import type { Header as HeaderData, Page, Post, User } from '@/payload-types'
import { useTheme } from '@/providers/Theme'
import { getImplicitPreference } from '@/providers/Theme/shared'

type NavItem = {
  href: string
  label: string
  newTab: boolean
}

const isNotNull = <T,>(v: T | null | undefined): v is T => v != null

function getUserInitials(user: User | null): string {
  if (!user) return ''

  // Try to get name from user object
  const name = user.name || user.email || ''

  // Split by space and get first letter of first two words
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }

  // If only one word, take first two letters
  if (parts.length === 1 && parts[0].length >= 2) {
    return parts[0].substring(0, 2).toUpperCase()
  }

  // Fallback to first letter
  return parts[0]?.[0]?.toUpperCase() || 'U'
}

interface HeaderClientProps {
  data?: HeaderData | null
}

const fallbackNavItems: NavItem[] = [
  { href: '/protocols', label: 'Protocols', newTab: false },
  { href: '#', label: 'References', newTab: false },
  { href: '#', label: 'Calculators', newTab: false },
  { href: '#', label: 'Checklists', newTab: false },
  { href: '#', label: 'Safety Concerns', newTab: false },
]

function resolveNavItems(data?: HeaderData | null): NavItem[] {
  const cmsNavItems =
    data?.navItems
      ?.map(({ link }) => {
        if (!link) return null

        const { label, newTab, type, reference, url } = link

        // Reference to Page or Post
        if (type === 'reference' && reference && typeof reference.value === 'object') {
          const referencedDoc = reference.value as Page | Post
          const slug = referencedDoc?.slug
          if (!slug) return null

          const basePath = reference.relationTo === 'pages' ? '' : `/${reference.relationTo}`
          return {
            href: `${basePath}/${slug}`.replace('//', '/'),
            label: label ?? referencedDoc.title ?? slug,
            newTab: Boolean(newTab),
          }
        }

        // External / custom URL
        if (url && label) {
          return { href: url, label, newTab: Boolean(newTab) }
        }

        return null
      })
      .filter(isNotNull) ?? []

  if (cmsNavItems.length === 0) return fallbackNavItems

  // Merge + de-dupe CMS over fallback
  const seen = new Set<string>()
  const merged: NavItem[] = []

  const addItem = (item: NavItem) => {
    const key = `${item.href}|${item.label}`
    if (!seen.has(key)) {
      seen.add(key)
      merged.push(item)
    }
  }

  fallbackNavItems.forEach(addItem)
  cmsNavItems.forEach(addItem)

  return merged
}

export const HeaderClient: React.FC<HeaderClientProps> = ({ data }) => {
  const { theme, setTheme } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [serviceLine, setServiceLine] = useState<'CCT' | 'ALS/BLS'>('CCT')
  const [user, setUser] = useState<User | null>(null)

  const navItems = resolveNavItems(data)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/users/me')
        if (res.ok) {
          const userData = await res.json()
          setUser(userData.user)
        } else {
          setUser(null)
        }
      } catch {
        setUser(null)
      }
    }
    checkAuth()
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMobileOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      <header className="h-16 border-b dark:border-neutral-700 bg-white dark:bg-neutral-800 sticky top-0 z-50 px-4">
        <div className="h-full flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-red-600 flex items-center justify-center">
              <HeartPulse className="h-5 w-5 text-white" />
            </div>
            <div className="leading-tight">
              <div className="font-semibold">Air Care & Mobile Care</div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">UC Health Critical Care Transport</div>
            </div>
          </Link>

          <div className="flex-1 hidden xl:flex items-center justify-center">
            <nav aria-label="Primary" className="flex items-center gap-6">
              {navItems.map(({ href, label, newTab }) => (
                <Link
                  key={label}
                  className="text-sm px-2 py-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700"
                  href={href}
                  target={newTab ? '_blank' : undefined}
                  rel={newTab ? 'noreferrer noopener' : undefined}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setMobileOpen(o => !o)}
              className="xl:hidden rounded-xl border dark:border-neutral-700 px-3 py-2 text-sm inline-flex items-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-700"
              aria-label="Open menu"
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
            >
              <Menu className="h-4 w-4" />
            </button>

            <div className="rounded-xl border dark:border-neutral-700 bg-white dark:bg-neutral-800 p-1 gap-1 flex">
              <button
                className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${serviceLine === 'CCT' ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900' : 'hover:bg-neutral-100 dark:hover:bg-neutral-700'}`}
                onClick={() => setServiceLine('CCT')}
                aria-pressed={serviceLine === 'CCT'}
              >
                CCT
              </button>
              <button
                className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${serviceLine === 'ALS/BLS' ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900' : 'hover:bg-neutral-100 dark:hover:bg-neutral-700'}`}
                onClick={() => setServiceLine('ALS/BLS')}
                aria-pressed={serviceLine === 'ALS/BLS'}
              >
                ALS/BLS
              </button>
            </div>

            {user ? (
              <Link
                href="/admin"
                className="rounded-xl border dark:border-neutral-700 px-3 py-2 text-sm inline-flex items-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                aria-label="Admin dashboard"
              >
                <div className="h-6 w-6 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-semibold">
                  {getUserInitials(user)}
                </div>
              </Link>
            ) : (
              <Link
                href="/admin/login"
                className="rounded-xl border dark:border-neutral-700 px-3 py-2 text-sm inline-flex items-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                aria-label="Login"
              >
                <Users className="h-4 w-4" />
              </Link>
            )}

            <button
              onClick={() => {
                const currentTheme = theme || getImplicitPreference() || 'light'
                setTheme(currentTheme === 'dark' ? 'light' : 'dark')
              }}
              className="rounded-xl border dark:border-neutral-700 px-3 py-2 text-sm inline-flex items-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-700"
              aria-label="Toggle theme"
            >
              {(theme || getImplicitPreference()) === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>

          {mobileOpen && (
            <div className="xl:hidden absolute left-0 right-0 top-16 z-50 px-4" id="mobile-menu" role="dialog" aria-modal="true">
              <div className="rounded-2xl border dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-xl overflow-hidden">
                <nav className="p-2">
                  {navItems.map(({ href, label, newTab }) => (
                    <Link
                      key={label}
                      className="block px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700"
                      href={href}
                      onClick={() => setMobileOpen(false)}
                      target={newTab ? '_blank' : undefined}
                      rel={newTab ? 'noreferrer noopener' : undefined}
                    >
                      {label}
                    </Link>
                  ))}
                </nav>
              </div>
            </div>
          )}
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 xl:hidden" onClick={() => setMobileOpen(false)} />
      )}
    </>
  )
}