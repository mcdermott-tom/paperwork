'use client'

import { createClient } from '@/utils/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  // Function for NEW users
  const handleSignUp = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    })
    setLoading(false)
    if (error) alert(error.message)
    else alert('Check your email to confirm your account!')
  }

  // Function for RETURNING users
  const handleSignIn = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    setLoading(false)
    if (error) {
      alert(error.message)
    } else {
      router.push('/dashboard') // Redirects on success
      router.refresh()
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white border rounded-lg shadow-sm">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Paperwork</h1>
          <p className="text-gray-500">Enter your email and password to continue</p>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">Email</label>
            <input
              className="flex h-10 w-full rounded-md border border-input px-3 py-2 text-sm"
              type="email"
              placeholder="m.jackson@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">Password</label>
            <input
              className="flex h-10 w-full rounded-md border border-input px-3 py-2 text-sm"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="flex gap-4 pt-2">
            <button 
              onClick={handleSignIn}
              disabled={loading}
              className="flex-1 h-10 rounded-md bg-black text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? '...' : 'Log In'}
            </button>
            <button 
              onClick={handleSignUp}
              disabled={loading}
              className="flex-1 h-10 rounded-md border border-gray-300 hover:bg-gray-100 disabled:opacity-50"
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}