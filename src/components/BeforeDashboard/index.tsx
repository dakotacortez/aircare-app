import { Banner } from '@payloadcms/ui/elements/Banner'
import React from 'react'
import Link from 'next/link'

import './index.scss'

const baseClass = 'before-dashboard'

const BeforeDashboard: React.FC = () => {
  return (
    <div className={baseClass}>
      {/* Welcome Header */}
      <div className={`${baseClass}__header`}>
        <div className={`${baseClass}__header-content`}>
          <h2 className={`${baseClass}__title`}>Welcome to Air Care CMS</h2>
          <p className={`${baseClass}__subtitle`}>Manage clinical protocols, hospital directories, and content</p>
        </div>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className={`${baseClass}__view-site-btn`}
        >
          View Site →
        </a>
      </div>

      {/* Stats Grid */}
      <div className={`${baseClass}__stats-grid`}>
        <div className={`${baseClass}__stat-card`}>
          <div className={`${baseClass}__stat-label`}>Collections</div>
          <div className={`${baseClass}__stat-value`}>12+</div>
          <div className={`${baseClass}__stat-desc`}>Active collections</div>
        </div>
        <div className={`${baseClass}__stat-card`}>
          <div className={`${baseClass}__stat-label`}>Content</div>
          <div className={`${baseClass}__stat-value`}>Protocol Management</div>
          <div className={`${baseClass}__stat-desc`}>Clinical protocols & procedures</div>
        </div>
        <div className={`${baseClass}__stat-card`}>
          <div className={`${baseClass}__stat-label`}>Directory</div>
          <div className={`${baseClass}__stat-value`}>Hospitals & Bases</div>
          <div className={`${baseClass}__stat-desc`}>Air medical facilities</div>
        </div>
      </div>

      {/* Quick Links Section */}
      <div className={`${baseClass}__section`}>
        <h3 className={`${baseClass}__section-title`}>Quick Links</h3>
        <div className={`${baseClass}__quick-links`}>
          <Link href="/admin/collections/protocols" className={`${baseClass}__link-card`}>
            <div className={`${baseClass}__link-icon`}>📋</div>
            <div className={`${baseClass}__link-content`}>
              <div className={`${baseClass}__link-title`}>Protocols</div>
              <div className={`${baseClass}__link-desc`}>Clinical protocols and procedures</div>
            </div>
          </Link>

          <Link href="/admin/collections/medications" className={`${baseClass}__link-card`}>
            <div className={`${baseClass}__link-icon`}>💊</div>
            <div className={`${baseClass}__link-content`}>
              <div className={`${baseClass}__link-title`}>Medications</div>
              <div className={`${baseClass}__link-desc`}>Medication database and dosing</div>
            </div>
          </Link>

          <Link href="/admin/collections/hospitals" className={`${baseClass}__link-card`}>
            <div className={`${baseClass}__link-icon`}>🏥</div>
            <div className={`${baseClass}__link-content`}>
              <div className={`${baseClass}__link-title`}>Hospitals Directory</div>
              <div className={`${baseClass}__link-desc`}>Manage hospital information and capabilities</div>
            </div>
          </Link>

          <Link href="/admin/collections/bases" className={`${baseClass}__link-card`}>
            <div className={`${baseClass}__link-icon`}>🚁</div>
            <div className={`${baseClass}__link-content`}>
              <div className={`${baseClass}__link-title`}>Bases Directory</div>
              <div className={`${baseClass}__link-desc`}>Air medical base information</div>
            </div>
          </Link>

          <Link href="/admin/collections/hospital-change-requests" className={`${baseClass}__link-card`}>
            <div className={`${baseClass}__link-icon`}>✏️</div>
            <div className={`${baseClass}__link-content`}>
              <div className={`${baseClass}__link-title`}>Change Requests</div>
              <div className={`${baseClass}__link-desc`}>Review user-submitted updates</div>
            </div>
          </Link>

          <Link href="/admin/collections/users" className={`${baseClass}__link-card`}>
            <div className={`${baseClass}__link-icon`}>👥</div>
            <div className={`${baseClass}__link-content`}>
              <div className={`${baseClass}__link-title`}>Users</div>
              <div className={`${baseClass}__link-desc`}>Manage user accounts and roles</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity placeholder */}
      <div className={`${baseClass}__section`}>
        <h3 className={`${baseClass}__section-title`}>Getting Started</h3>
        <div className={`${baseClass}__info-card`}>
          <p className={`${baseClass}__info-text`}>
            Use the navigation menu on the left to access all collections and settings.
            The quick links above provide fast access to the most commonly used sections.
          </p>
        </div>
      </div>
    </div>
  )
}

export default BeforeDashboard
