import React from 'react'
import Link from 'next/link'

type Props = {
  reason: 'not-logged-in' | 'pending-approval' | 'inactive'
  userName?: string
}

export function ProtocolAccessDenied({ reason, userName }: Props) {
  if (reason === 'not-logged-in') {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
              Protocols Access
            </h1>
            <p className="text-lg text-neutral-600 dark:text-neutral-400">
              Clinical protocols are available to approved team members only.
            </p>
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 shadow-sm border border-neutral-200 dark:border-neutral-700 space-y-4">
            <p className="text-neutral-700 dark:text-neutral-300">
              If you&apos;re a clinical team member, please sign in or create an account to request
              access.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/login"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="flex-1 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-900 dark:text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                Create Account
              </Link>
            </div>
          </div>

          <div className="text-sm text-neutral-500 dark:text-neutral-400">
            <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 underline">
              Return to home page
            </Link>
            {' or '}
            <Link
              href="/tools"
              className="hover:text-blue-600 dark:hover:text-blue-400 underline"
            >
              view calculators and references
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (reason === 'pending-approval') {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="space-y-2">
            <div className="mx-auto w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-yellow-600 dark:text-yellow-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
              Awaiting Approval
            </h1>
            {userName && (
              <p className="text-neutral-600 dark:text-neutral-400">Welcome, {userName}</p>
            )}
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 shadow-sm border border-neutral-200 dark:border-neutral-700 space-y-4">
            <p className="text-neutral-700 dark:text-neutral-300">
              Your account is pending approval by the content team. You&apos;ll receive access to the
              protocol library once your account has been approved.
            </p>

            <div className="text-sm text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-900/50 rounded p-4">
              <p className="font-medium mb-2">What happens next?</p>
              <ul className="text-left space-y-1">
                <li>• A team administrator will review your account</li>
                <li>• You&apos;ll be notified once you&apos;re approved</li>
                <li>• Approval typically takes 1-2 business days</li>
              </ul>
            </div>
          </div>

          <div className="text-sm text-neutral-500 dark:text-neutral-400">
            <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 underline">
              Return to home page
            </Link>
            {' or '}
            <Link
              href="/tools"
              className="hover:text-blue-600 dark:hover:text-blue-400 underline"
            >
              view calculators and references
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Inactive account
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-red-600 dark:text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
            Account Inactive
          </h1>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 shadow-sm border border-neutral-200 dark:border-neutral-700">
          <p className="text-neutral-700 dark:text-neutral-300">
            Your account is currently inactive. Please contact your administrator for assistance.
          </p>
        </div>

        <div className="text-sm text-neutral-500 dark:text-neutral-400">
          <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 underline">
            Return to home page
          </Link>
        </div>
      </div>
    </div>
  )
}
