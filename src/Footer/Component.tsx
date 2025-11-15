import React from 'react'
import { cookies } from 'next/headers'
import { getCachedGlobal } from '@/utilities/getGlobals'
import type { Footer as FooterType, Page, Post } from '@/payload-types'
import { FooterContent } from './FooterContent'

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

  return <FooterContent navItems={navItems} isLoggedIn={isLoggedIn} />
}
