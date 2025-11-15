'use client'

import React from 'react'
import Link from 'next/link'
import { ThemeSelector } from '@/providers/Theme/ThemeSelector'
import { useIsNativeApp } from '@/hooks/useIsNativeApp'

type NavItem = {
  href: string
  label: string
  newTab: boolean
}

interface FooterContentProps {
  navItems: NavItem[]
  isLoggedIn: boolean
}

export function FooterContent({ navItems, isLoggedIn }: FooterContentProps) {
  const isNativeApp = useIsNativeApp()

  if (isNativeApp) {
    return null
  }

  return (
    <footer className="px-4 md:px-8 py-6 bg-white dark:bg-neutral-800 border-t dark:border-neutral-700 mt-auto">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400">
        <div>© {new Date().getFullYear()} Air Care & Mobile Care · All rights reserved</div>
        <div className="flex items-center gap-4">
          {navItems.map(({ href, label, newTab }, index) => (
            <React.Fragment key={`${href}-${label}`}>
              {index > 0 && <span>·</span>}
              <Link
                href={href}
                target={newTab ? '_blank' : undefined}
                rel={newTab ? 'noreferrer noopener' : undefined}
                className="hover:text-neutral-900 dark:hover:text-neutral-100"
              >
                {label}
              </Link>
            </React.Fragment>
          ))}
          {navItems.length > 0 && isLoggedIn && <span>·</span>}
          {isLoggedIn && (
            <Link href="/admin" className="hover:text-neutral-900 dark:hover:text-neutral-100">
              Admin
            </Link>
          )}
          {(navItems.length > 0 || isLoggedIn) && <span>·</span>}
          <ThemeSelector />
        </div>
      </div>
    </footer>
  )
}
