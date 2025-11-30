'use client'

import { createClient } from '@/utils/supabase/client'
import { useState } from 'react'

export default function LoginPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    })
    if (error) alert(error.message)
    else alert('Check your email for the login link!')
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md p-8 space-y-4 border rounded-lg shadow">
        <h1 className="text-2xl font-bold text-center">Sign In</h1>
        <input
          className="w-full p-2 border rounded"
          type="email"
          placeholder="email@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button 
          onClick={handleLogin}
          className="w-full p-2 text-white bg-black rounded hover:bg-gray-800"
        >
          Send Magic Link
        </button>
      </div>
    </div>
  )
}