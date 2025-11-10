import { ThemeSelector } from '@/providers/Theme/ThemeSelector'
import React from 'react'
import Link from 'next/link'
import { cookies } from 'next/headers'

export async function Footer() {
  // Check if user is logged in
  const cookieStore = await cookies()
  const payloadToken = cookieStore.get('payload-token')
  const isLoggedIn = !!payloadToken

  return (
    <footer className="px-4 md:px-8 py-6 bg-white dark:bg-neutral-800 border-t dark:border-neutral-700 mt-auto">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400">
        <div>© {new Date().getFullYear()} Air Care & Mobile Care · All rights reserved</div>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-neutral-900 dark:hover:text-neutral-100">Changelog</a>
          <span>·</span>
          <a href="#" className="hover:text-neutral-900 dark:hover:text-neutral-100">Version 0.1</a>
          {isLoggedIn && (
            <>
              <span>·</span>
              <Link href="/admin" className="hover:text-neutral-900 dark:hover:text-neutral-100">
                Admin
              </Link>
            </>
          )}
          <span>·</span>
          <ThemeSelector />
        </div>
      </div>
    </footer>
  )
}
