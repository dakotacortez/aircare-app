'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { HeartPulse, Menu, Sun, Moon, Users } from 'lucide-react'

import type { Header as HeaderData, Page, Post } from '@/payload-types'

type NavItem = {
  href: string
  label: string
  newTab?: boolean
}

interface HeaderClientProps {
  data?: HeaderData | null
}

const fallbackNavItems: NavItem[] = [
  { href: '/protocols', label: 'Protocols' },
  { href: '#', label: 'References' },
  { href: '#', label: 'Calculators' },
  { href: '#', label: 'Checklists' },
  { href: '#', label: 'Safety Concerns' },
]

function resolveNavItems(data?: HeaderData | null): NavItem[] {
  const cmsNavItems =
    data?.navItems
      ?.map(({ link }) => {
        if (!link) return null

        const { label, newTab, type, reference, url } = link

        if (type === 'reference' && reference && typeof reference.value === 'object') {
          const referencedDoc = reference.value as Page | Post
          const slug = referencedDoc?.slug

          if (!slug) return null

          const basePath = reference.relationTo === 'pages' ? '' : `/${reference.relationTo}`
          return {
            href: `${basePath}/${slug}`.replace('//', '/'),
            label: label ?? referencedDoc.title ?? slug,
            newTab: newTab ?? false,
          }
        }

        if (url && label) {
          return {
            href: url,
            label,
            newTab: newTab ?? false,
          }
        }

        return null
      })
      .filter((link): link is NavItem => Boolean(link && link.href && link.label)) ?? []

  if (cmsNavItems.length === 0) {
    return fallbackNavItems
  }

  const seen = new Set<string>()
  const merged: NavItem[] = []

  const addItem = (item: NavItem) => {
    const key = `${item.href}|${item.label}`
    if (seen.has(key)) return
    seen.add(key)
    merged.push(item)
  }

  fallbackNavItems.forEach(addItem)
  cmsNavItems.forEach(addItem)

  return merged
}

export const HeaderClient: React.FC<HeaderClientProps> = ({ data }) => {
  const [dark, setDark] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [serviceLine, setServiceLine] = useState('CCT')
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const navItems = resolveNavItems(data)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/users/me')
        setIsLoggedIn(response.ok)
      } catch {
        setIsLoggedIn(false)
      }
    }
    checkAuth()
  }, [])

  useEffect(() => {
    const theme = typeof window !== 'undefined' ? localStorage.getItem('acmc_theme') : null
    if (theme === 'dark') {
      setDark(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('acmc_theme', dark ? 'dark' : 'light')
      if (dark) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }, [dark])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { 
      if (e.key === 'Escape') setMobileOpen(false) 
    }
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

          <div className="flex-1 hidden lg:flex items-center justify-center">
            <nav aria-label="Primary" className="flex items-center gap-6">
              {navItems.map(({ href, label, newTab }) => {
                const isInternalLink = href.startsWith('/') && !newTab

                if (isInternalLink) {
                  return (
                    <Link
                      key={label}
                      className="text-sm px-2 py-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700"
                      href={href}
                    >
                      {label}
                    </Link>
                  )
                }

                return (
                  <a
                    key={label}
                    className="text-sm px-2 py-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700"
                    href={href}
                    rel={newTab ? 'noreferrer noopener' : undefined}
                    target={newTab ? '_blank' : undefined}
                  >
                    {label}
                  </a>
                )
              })}
            </nav>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setMobileOpen((o) => !o)}
              className="lg:hidden rounded-xl border dark:border-neutral-700 px-3 py-2 text-sm inline-flex items-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-700"
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

            {isLoggedIn ? (
              <Link
                href="/admin"
                className="rounded-xl border dark:border-neutral-700 px-3 py-2 text-sm inline-flex items-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                aria-label="Admin dashboard"
              >
                <span className="text-xs font-semibold">Admin</span>
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
              onClick={() => setDark((d) => !d)}
              className="rounded-xl border dark:border-neutral-700 px-3 py-2 text-sm inline-flex items-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-700"
              aria-label="Toggle theme"
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>

          {mobileOpen && (
            <div className="lg:hidden absolute left-0 right-0 top-16 z-50 px-4" id="mobile-menu" role="dialog" aria-modal="true">
              <div className="rounded-2xl border dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-xl overflow-hidden">
                <nav className="p-2">
                  {navItems.map(({ href, label, newTab }) => {
                    const isInternalLink = href.startsWith('/') && !newTab

                    if (isInternalLink) {
                      return (
                        <Link
                          key={label}
                          className="block px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700"
                          href={href}
                          onClick={() => setMobileOpen(false)}
                        >
                          {label}
                        </Link>
                      )
                    }

                    return (
                      <a
                        key={label}
                        className="block px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700"
                        href={href}
                        onClick={() => setMobileOpen(false)}
                        rel={newTab ? 'noreferrer noopener' : undefined}
                        target={newTab ? '_blank' : undefined}
                      >
                        {label}
                      </a>
                    )
                  })}
                </nav>
              </div>
            </div>
          )}
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}
    </>
  )
}
