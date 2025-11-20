import { Banner } from '@payloadcms/ui/elements/Banner'
import React from 'react'
import Link from 'next/link'

import './index.scss'

const baseClass = 'before-dashboard'

const BeforeDashboard: React.FC = () => {
  return (
    <div className={baseClass}>
      <Banner className={`${baseClass}__banner`} type="success">
        <h4>Welcome to Air Care CMS</h4>
      </Banner>
      <div style={{ marginTop: '1rem', marginBottom: '1.5rem' }}>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-block',
            padding: '0.5rem 1rem',
            backgroundColor: '#0070f3',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '6px',
            fontWeight: '500',
            fontSize: '0.95rem',
          }}
        >
          View Site →
        </a>
      </div>
      Quick Links:
      <ul className={`${baseClass}__instructions`}>
        <li>
          <Link href="/admin/collections/hospitals">Hospitals Directory</Link>
          {' - Manage hospital information, capabilities, and contact details'}
        </li>
        <li>
          <Link href="/admin/collections/bases">Bases Directory</Link>
          {' - Manage air medical base information'}
        </li>
        <li>
          <Link href="/admin/collections/protocols">Protocols</Link>
          {' - Clinical protocols and procedures'}
        </li>
        <li>
          <Link href="/admin/collections/hospital-change-requests">Hospital Change Requests</Link>
          {' - Review user-submitted updates'}
        </li>
      </ul>
    </div>
  )
}

export default BeforeDashboard
