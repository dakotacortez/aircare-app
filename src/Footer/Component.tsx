import { ThemeSelector } from '@/providers/Theme/ThemeSelector'
import React from 'react'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { getCachedGlobal } from '@/utilities/getGlobals'
import type { Footer as FooterType, Page, Post } from '@/payload-types'

type NavItem = {
  href: string
  label: string
  newTab: boolean
}

const isNotNull = <T,>(v: T | null | undefined): v is T => v != null

function resolveFooterNavItems(data?: FooterType | null): NavItem[] {
  const navItems =
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

  return navItems
}

export async function Footer() {
  // Check if user is logged in
  const cookieStore = await cookies()
  const payloadToken = cookieStore.get('payload-token')
  const isLoggedIn = !!payloadToken

  // Fetch footer data from CMS
  const footerData: FooterType = await getCachedGlobal('footer', 1)()
  const navItems = resolveFooterNavItems(footerData)

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
