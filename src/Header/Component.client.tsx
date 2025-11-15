'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { HeartPulse, Sun, Moon, Users, FolderOpen, Monitor } from 'lucide-react'

import type { Header as HeaderData, Page, Post, User } from '@/payload-types'
import { useTheme } from '@/providers/Theme'
import { getImplicitPreference } from '@/providers/Theme/shared'
import { useServiceLine } from '@/providers/ServiceLine'
import { useReferenceCard } from '@/hooks/useReferenceCard'

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

  // If only one word (no last name), take just first letter
  return parts[0]?.[0]?.toUpperCase() || 'U'
}

interface HeaderClientProps {
  data?: HeaderData | null
}

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

  // Return only CMS items managed through admin panel
  return cmsNavItems
}

export const HeaderClient: React.FC<HeaderClientProps> = ({ data }) => {
  const { theme, setTheme } = useTheme()
  const { serviceLine, setServiceLine } = useServiceLine()
  const { savedCount, setDrawerOpen, isMobile } = useReferenceCard()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('light')
  const pathname = usePathname()

  const navItems = resolveNavItems(data)
  const isAdminUser = user?.role === 'content-team' || user?.role === 'admin-team'
  const profileLink = user ? { href: '/account', label: 'Edit Profile' } : null
  const adminLink = isAdminUser ? { href: '/admin', label: 'Admin / CMS' } : null
  
  // Only show service line toggle on protocol pages
  const isProtocolPage = pathname?.startsWith('/protocols')

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
    // Update effective theme when theme changes or on mount
    if (theme === 'system' || theme === null || theme === undefined) {
      const current = getImplicitPreference() || 'light'
      setEffectiveTheme(current)
    } else {
      setEffectiveTheme(theme)
    }
  }, [theme])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileOpen(false)
        setUserMenuOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
        <header className="safe-area-top border-b dark:border-neutral-700 bg-white dark:bg-neutral-800 sticky top-0 z-50 px-4">
          <div className="flex min-h-16 items-center gap-3">
          {/* Logo - opens nav menu on mobile, links to home on desktop */}
          <button
            onClick={() => setMobileOpen(o => !o)}
            className="xl:hidden flex items-center gap-3"
            aria-label="Open menu"
          >
            <div className="h-9 w-9 rounded-xl bg-red-600 flex items-center justify-center flex-shrink-0">
              <HeartPulse className="h-5 w-5 text-white" />
            </div>
            <div className="leading-tight hidden sm:block">
              <div className="font-semibold">Air Care & Mobile Care</div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">Critical Care Transport</div>
            </div>
          </button>
          <Link href="/" className="hidden xl:flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-red-600 flex items-center justify-center flex-shrink-0">
              <HeartPulse className="h-5 w-5 text-white" />
            </div>
            <div className="leading-tight">
              <div className="font-semibold">Air Care & Mobile Care</div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">Critical Care Transport</div>
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
            {/* Service Line Toggle - Only on Protocol Pages */}
            {isProtocolPage && (
              <div className="rounded-xl border dark:border-neutral-700 bg-white dark:bg-neutral-800 p-1 gap-1 flex">
                <button
                  className={`px-2.5 py-1 text-xs rounded-xl transition-colors font-medium ${
                    serviceLine === 'BLS'
                      ? 'bg-green-600 text-white shadow-sm'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                  }`}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setServiceLine('BLS')
                  }}
                  aria-pressed={serviceLine === 'BLS'}
                  title="Basic Life Support"
                  data-service-line="BLS"
                  type="button"
                >
                  BLS
                </button>
                <button
                  className={`px-2.5 py-1 text-xs rounded-xl transition-colors font-medium ${
                    serviceLine === 'ALS'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                  }`}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setServiceLine('ALS')
                  }}
                  aria-pressed={serviceLine === 'ALS'}
                  title="Advanced Life Support"
                  data-service-line="ALS"
                  type="button"
                >
                  ALS
                </button>
                <button
                  className={`px-2.5 py-1 text-xs rounded-xl transition-colors font-medium ${
                    serviceLine === 'CCT'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                  }`}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setServiceLine('CCT')
                  }}
                  aria-pressed={serviceLine === 'CCT'}
                  title="Critical Care Transport"
                  data-service-line="CCT"
                  type="button"
                >
                  CCT
                </button>
              </div>
            )}

            {/* Reference Card Button - Mobile/Tablet Only */}
            {isMobile && (
              <button
                onClick={() => setDrawerOpen(true)}
                className="relative rounded-xl border dark:border-neutral-700 px-3 py-2 text-sm inline-flex items-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                aria-label="Open reference cards"
              >
                <FolderOpen className="h-4 w-4" />
                {savedCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full min-w-[1.25rem] h-5 px-1 flex items-center justify-center text-xs font-bold">
                    {savedCount}
                  </span>
                )}
              </button>
            )}

              {/* User menu - dropdown */}
              <div className="relative">
                {user && profileLink ? (
                  <>
                    {/* Menu button for all screen sizes */}
                    <button
                      onClick={() => setUserMenuOpen((open) => !open)}
                      className="rounded-xl border dark:border-neutral-700 px-3 py-2 text-sm inline-flex items-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                      aria-label="User menu"
                      aria-expanded={userMenuOpen}
                    >
                      <div className="h-6 w-6 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-semibold">
                        {getUserInitials(user)}
                      </div>
                    </button>
                  </>
                ) : (
                  <Link
                    href="/admin/login"
                    className="rounded-xl border dark:border-neutral-700 px-3 py-2 text-sm inline-flex items-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                    aria-label="Login"
                  >
                    <Users className="h-4 w-4" />
                  </Link>
                )}

                {/* User menu dropdown */}
                {userMenuOpen && user && profileLink && (
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-xl z-50">
                    <div className="p-2">
                      <Link
                        href={profileLink.href}
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-sm"
                      >
                        {profileLink.label}
                      </Link>
                      {adminLink && (
                        <Link
                          href={adminLink.href}
                          onClick={() => setUserMenuOpen(false)}
                          className="block px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-sm"
                        >
                          {adminLink.label}
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          const nextTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'
                          setTheme(nextTheme)
                          setUserMenuOpen(false)
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-sm flex items-center gap-2"
                      >
                        {theme === 'system' ? (
                          <>
                            <Monitor className="h-4 w-4" />
                            System Theme
                          </>
                        ) : effectiveTheme === 'dark' ? (
                          <>
                            <Moon className="h-4 w-4" />
                            Dark Mode
                          </>
                        ) : (
                          <>
                            <Sun className="h-4 w-4" />
                            Light Mode
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

            {/* Theme toggle - desktop only */}
            <button
              onClick={() => {
                const nextTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'
                setTheme(nextTheme)
              }}
              className="hidden xl:inline-flex rounded-xl border dark:border-neutral-700 px-3 py-2 text-sm items-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-700"
              aria-label="Toggle theme"
            >
              {theme === 'system' ? (
                <Monitor className="h-4 w-4" />
              ) : effectiveTheme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
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
      {userMenuOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
      )}
    </>
  )
}