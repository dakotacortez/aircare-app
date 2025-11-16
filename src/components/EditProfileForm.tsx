'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import type { User } from '@/payload-types'
import type { ServiceLineType } from '@/providers/ServiceLine'
import { useServiceLine } from '@/providers/ServiceLine'
import { useRouter } from 'next/navigation'
import { Upload, Trash2, Bell, BellOff } from 'lucide-react'

const SERVICE_LINE_LABELS: Record<ServiceLineType, string> = {
  BLS: 'BLS (Basic Life Support)',
  ALS: 'ALS (Advanced Life Support)',
  CCT: 'CCT (Critical Care Transport)',
}

type UserUpdatePayload = {
  name: string
  email: string
  defaultServiceLine: ServiceLineType
  pushNotificationsEnabled: boolean
  profileImage?: number | string
  password?: string
  currentPassword?: string
}

interface EditProfileFormProps {
  initialUser: User
}

export function EditProfileForm({ initialUser }: EditProfileFormProps) {
  const router = useRouter()
  const [name, setName] = useState(initialUser.name ?? '')
  const [email, setEmail] = useState(initialUser.email ?? '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [defaultServiceLine, setDefaultServiceLine] = useState<ServiceLineType>(
    (initialUser.defaultServiceLine as ServiceLineType) ?? 'ALS',
  )
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(
    initialUser.pushNotificationsEnabled ?? false,
  )
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { setServiceLine } = useServiceLine()

  const isAdminUser = initialUser.role === 'admin-team' || initialUser.role === 'content-team'

  const handleImageUpload = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const uploadResponse = await fetch('/api/media', {
        method: 'POST',
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image')
      }

      const uploadData = await uploadResponse.json()
      return uploadData.doc.id
    } catch (error) {
      console.error('Image upload error:', error)
      return null
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setSuccessMessage(null)
    setErrorMessage(null)

    try {
      // Validate password change if attempted
      if (newPassword || confirmPassword) {
        if (!currentPassword) {
          throw new Error('Current password is required to change your password.')
        }
        if (newPassword !== confirmPassword) {
          throw new Error('New passwords do not match.')
        }
        if (newPassword.length < 8) {
          throw new Error('New password must be at least 8 characters long.')
        }
      }

      // Upload profile image if changed
      let profileImageId: string | number | null = null
      if (profileImage) {
        profileImageId = await handleImageUpload(profileImage)
        if (!profileImageId) {
          throw new Error('Failed to upload profile image')
        }
      }

      // Build update payload
      const updateData: UserUpdatePayload = {
        name,
        email,
        defaultServiceLine,
        pushNotificationsEnabled,
      }

      if (profileImageId) {
        updateData.profileImage = profileImageId
      }

      if (newPassword && currentPassword) {
        updateData.password = newPassword
        updateData.currentPassword = currentPassword
      }

      const response = await fetch(`/api/users/${initialUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.errors?.[0]?.message || 'Unable to update your profile.')
      }

      setSuccessMessage('Profile updated successfully.')
      setServiceLine(defaultServiceLine)

      // Clear password fields
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setProfileImage(null)

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

      // Refresh page to show updated data
      router.refresh()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    setDeleting(true)
    setSuccessMessage(null)
    setErrorMessage(null)

    try {
      const response = await fetch(`/api/users/${initialUser.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.errors?.[0]?.message || 'Unable to delete your account.')
      }

      // Log out and redirect
      await fetch('/api/users/logout', { method: 'POST' })
      router.push('/login?deleted=true')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to delete account.')
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  useEffect(() => {
    if (!profileImage) {
      setProfileImagePreview(null)
      return
    }

    const objectUrl = URL.createObjectURL(profileImage)
    setProfileImagePreview(objectUrl)

    return () => URL.revokeObjectURL(objectUrl)
  }, [profileImage])

  const profileImageDoc =
    typeof initialUser.profileImage === 'object' && initialUser.profileImage !== null
      ? initialUser.profileImage
      : null
  const profileImageUrl = profileImageDoc?.url ?? null
  const profileImageSrc = profileImagePreview ?? profileImageUrl

  return (
    <div className="min-h-[70vh] bg-neutral-50 dark:bg-neutral-900 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Manage your profile, preferences, and account settings.
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

            {/* Profile Image */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Profile Image
              </label>
              <div className="flex items-center gap-4">
                  {profileImageSrc && (
                    <div className="relative h-20 w-20 rounded-full overflow-hidden bg-neutral-100 dark:bg-neutral-700">
                      <Image
                        src={profileImageSrc}
                        alt={profileImagePreview ? 'Profile preview' : 'Profile'}
                        fill
                        sizes="80px"
                        className="object-cover"
                        unoptimized={Boolean(profileImagePreview)}
                      />
                    </div>
                  )}
                <label className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-neutral-100 dark:bg-neutral-700 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600 transition">
                  <Upload className="h-4 w-4" />
                  {profileImage || profileImageUrl ? 'Change Image' : 'Upload Image'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setProfileImage(e.target.files[0])
                      }
                    }}
                  />
                </label>
              </div>
            </div>

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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 px-3 py-2 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* Password Change Section */}
            <div className="border-t border-neutral-200 dark:border-neutral-700 pt-6">
              <h2 className="text-lg font-semibold mb-4">Change Password</h2>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300" htmlFor="current-password">
                    Current Password
                  </label>
                  <input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 px-3 py-2 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300" htmlFor="new-password">
                    New Password
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 px-3 py-2 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300" htmlFor="confirm-password">
                    Confirm New Password
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 px-3 py-2 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••"
                  />
                </div>
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

            {/* Push Notifications Toggle */}
            <div className="flex items-center justify-between p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50">
              <div className="flex items-center gap-3">
                {pushNotificationsEnabled ? (
                  <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                ) : (
                  <BellOff className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
                )}
                <div>
                  <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    Push Notifications
                  </div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">
                    Receive updates for protocol changes and announcements
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPushNotificationsEnabled(!pushNotificationsEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                  pushNotificationsEnabled
                    ? 'bg-blue-600'
                    : 'bg-neutral-300 dark:bg-neutral-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    pushNotificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
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
                Changes apply immediately and sync with your saved preferences.
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

        {/* Account Deletion */}
        <div className="bg-white dark:bg-neutral-800 border border-red-200 dark:border-red-900 rounded-2xl shadow-sm mt-6">
          <div className="border-b border-red-200 dark:border-red-900 px-6 py-4">
            <h2 className="text-xl font-semibold text-red-900 dark:text-red-100">Danger Zone</h2>
          </div>
          <div className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                  Delete Account
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4" />
                Delete Account
              </button>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-xl max-w-md w-full border border-neutral-200 dark:border-neutral-700">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                  Confirm Account Deletion
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                  Are you sure you want to delete your account? This action is permanent and cannot be undone. All
                  your data will be permanently removed from our servers.
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={deleting}
                    className="flex-1 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-600 transition disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                    className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition disabled:opacity-60"
                  >
                    {deleting ? 'Deleting...' : 'Delete My Account'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
