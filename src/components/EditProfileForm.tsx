'use client'

import React, { useState } from 'react'
import type { User } from '@/payload-types'
import type { ServiceLineType } from '@/providers/ServiceLine'
import { useServiceLine } from '@/providers/ServiceLine'

const SERVICE_LINE_LABELS: Record<ServiceLineType, string> = {
  BLS: 'BLS (Basic Life Support)',
  ALS: 'ALS (Advanced Life Support)',
  CCT: 'CCT (Critical Care Transport)',
}

interface EditProfileFormProps {
  initialUser: User
}

export function EditProfileForm({ initialUser }: EditProfileFormProps) {
  const [name, setName] = useState(initialUser.name ?? '')
  const [defaultServiceLine, setDefaultServiceLine] = useState<ServiceLineType>(
    (initialUser.defaultServiceLine as ServiceLineType) ?? 'ALS',
  )
  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { setServiceLine } = useServiceLine()

  const isAdminUser = initialUser.role === 'admin-team' || initialUser.role === 'content-team'

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setSuccessMessage(null)
    setErrorMessage(null)

    try {
      const response = await fetch(`/api/users/${initialUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          defaultServiceLine,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.errors?.[0]?.message || 'Unable to update your profile.')
      }

      setSuccessMessage('Profile updated successfully.')
      setServiceLine(defaultServiceLine)

      if (typeof window !== 'undefined') {
        localStorage.setItem('aircare-service-line', defaultServiceLine)
        localStorage.setItem(
          'aircare-service-line-meta',
          JSON.stringify({
            userId: initialUser.id,
            defaultServiceLine,
          }),
        )
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-[70vh] bg-neutral-50 dark:bg-neutral-900 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Manage your display name and service line preference without opening the admin console.
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl shadow-sm">
          <div className="border-b border-neutral-200 dark:border-neutral-700 px-6 py-4">
            <h1 className="text-2xl font-semibold">Edit Profile</h1>
          </div>

          <form className="p-6 space-y-6" onSubmit={handleSubmit}>
            {successMessage && (
              <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-900 dark:bg-green-900/20 dark:text-green-100">
                {successMessage}
              </div>
            )}
            {errorMessage && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-900/20 dark:text-red-100">
                {errorMessage}
              </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300" htmlFor="name">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 px-3 py-2 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={initialUser.email ?? ''}
                  readOnly
                  className="rounded-lg border border-neutral-200 dark:border-neutral-600 bg-neutral-100 dark:bg-neutral-700/70 px-3 py-2 text-neutral-500 dark:text-neutral-300 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label
                  className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                  htmlFor="default-service-line"
                >
                  Default Service Line
                </label>
                <select
                  id="default-service-line"
                  value={defaultServiceLine}
                  onChange={(event) => setDefaultServiceLine(event.target.value as ServiceLineType)}
                  className="rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 px-3 py-2 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(SERVICE_LINE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Account Status</span>
                <div className="rounded-lg border border-neutral-200 dark:border-neutral-600 bg-neutral-100 dark:bg-neutral-700/70 px-3 py-2 text-sm text-neutral-700 dark:text-neutral-200 flex items-center justify-between">
                  <span className="capitalize">{initialUser.status}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      initialUser.approved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {initialUser.approved ? 'Approved' : 'Pending'}
                  </span>
                </div>
              </div>
            </div>

            {isAdminUser && (
              <div className="rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/20 px-4 py-3 text-sm text-blue-800 dark:text-blue-100">
                <p className="font-medium">Admin access</p>
                <p className="mt-1">
                  You can still open the full admin panel for content updates. Use the menu in the header to access it.
                </p>
              </div>
            )}

            <div className="flex flex-col gap-4 border-t border-neutral-200 dark:border-neutral-700 pt-4">
              <div className="text-sm text-neutral-500 dark:text-neutral-400">
                Changes apply immediately and sync with your saved service line preference.
              </div>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
