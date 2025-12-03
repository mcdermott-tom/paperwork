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
    // FIX 1: Use bg-background for the whole screen
    <div className="flex min-h-screen items-center justify-center bg-background">
      
      {/* FIX 2: Use bg-card and border/text-foreground for theme awareness */}
      <div className="w-full max-w-md p-8 space-y-6 bg-card border border-border rounded-lg shadow-xl">
        <div className="space-y-2 text-center">
          {/* FIX 3: Heading colors now pick up foreground/primary colors */}
          <h1 className="text-3xl font-bold text-foreground">Paperwork Login</h1>
          <p className="text-muted-foreground">Enter your email and password to continue</p>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            {/* FIX 4: Label text now foreground color */}
            <label className="text-sm font-medium leading-none text-foreground">Email</label>
            <input
              // Standard input classes now rely on border-input and bg-background/card
              className="flex h-10 w-full rounded-md border border-input px-3 py-2 text-sm bg-background/50 focus:border-primary focus:ring-1 focus:ring-primary"
              type="email"
              placeholder="m.jackson@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none text-foreground">Password</label>
            <input
              className="flex h-10 w-full rounded-md border border-input px-3 py-2 text-sm bg-background/50 focus:border-primary focus:ring-1 focus:ring-primary"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="flex gap-4 pt-2">
            {/* FIX 5: Use bg-primary for main action */}
            <button 
              onClick={handleSignIn}
              disabled={loading}
              className="flex-1 h-10 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? '...' : 'Log In'}
            </button>
            
            {/* FIX 6: Use standard button styling */}
            <button 
              onClick={handleSignUp}
              disabled={loading}
              className="flex-1 h-10 rounded-md border border-input text-foreground hover:bg-secondary disabled:opacity-50"
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}