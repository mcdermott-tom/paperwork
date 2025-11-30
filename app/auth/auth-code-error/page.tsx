'use client'

import Link from 'next/link'

export default function AuthErrorPage() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-bold text-red-600">Authentication Error</h1>
      <p className="text-gray-600">The login link is invalid or has expired.</p>
      <Link href="/login" className="text-blue-500 hover:underline">
        Return to Login
      </Link>
    </div>
  )
}