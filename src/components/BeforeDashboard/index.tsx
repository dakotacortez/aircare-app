import { Banner } from '@payloadcms/ui/elements/Banner'
import React from 'react'

import { SeedButton } from './SeedButton'
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
          <a href="/admin/collections/hospitals">Hospitals Directory</a>
          {' - Manage hospital information, capabilities, and contact details'}
        </li>
        <li>
          <a href="/admin/collections/bases">Bases Directory</a>
          {' - Manage air medical base information'}
        </li>
        <li>
          <a href="/admin/collections/protocols">Protocols</a>
          {' - Clinical protocols and procedures'}
        </li>
        <li>
          <a href="/admin/collections/hospital-change-requests">Hospital Change Requests</a>
          {' - Review user-submitted updates'}
        </li>
      </ul>
    </div>
  )
}

export default BeforeDashboard
