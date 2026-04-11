'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'
import { DM_Sans, DM_Serif_Display } from 'next/font/google'
import styles from './LandingPage.module.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  display: 'swap',
})

const dmSerif = DM_Serif_Display({
  subsets: ['latin'],
  weight: ['400'],
  display: 'swap',
})

export default function LandingPage() {
  // prevent scroll-past to footer while splash is visible
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  return (
    <div className={`${styles.page} ${dmSans.className}`}>
      <div className={styles.gradient} />
      <div className={styles.noise} />

      <div className={styles.inner}>
        {/* Icon */}
        <div className={styles.iconWrap}>
          <div className={styles.iconRing}>
            <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden="true">
              <path d="M3.34 7a5 5 0 0 1 8.66-2L12 5.08l.06-.1A5 5 0 0 1 20.66 7c.34.97.34 2.03 0 3a5 5 0 0 1-1.66 2.5" />
              <path d="M12 21C6 15.5 3 12.5 3 10" />
              <polyline points="1 12 5 12 7 8 9 16 11 12 13 12" />
              <path d="M22 12c0 2.5-3 5.5-9 9" />
            </svg>
          </div>
        </div>

        {/* Wordmark */}
        <h1 className={`${styles.title} ${dmSerif.className}`}>ACMC</h1>
        <p className={styles.tagline}>Clinical Reference Platform</p>
        <div className={styles.divider} />

        {/* CTA */}
        <Link href="/login" className={styles.btn}>
          Sign In
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </Link>
      </div>

      <p className={`${styles.footer} ${dmSans.className}`}>Air Care &amp; Mobile Care</p>
    </div>
  )
}
