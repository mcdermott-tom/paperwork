'use client'

import { createClient } from '@/utils/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button' // Assuming you have this, otherwise use standard <button>

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  // Function for NEW users
  const handleSignUp = async () => {
    if (!email || !password) return alert('Please fill in all fields')
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
    if (!email || !password) return alert('Please fill in all fields')
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
    <div className="relative flex min-h-screen items-center justify-center bg-background p-4">
      
      {/* 1. ESCAPE HATCH (Back to Home) */}
      <div className="absolute top-4 left-4 md:top-8 md:left-8">
        <Link href="/" className="flex items-center gap-2 text-lg text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
        </Link>
      </div>

      <div className="w-full max-w-md p-8 space-y-6 bg-card border border-border rounded-lg shadow-xl">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold text-foreground">Paperwork Login</h1>
          <p className="text-muted-foreground">Enter your email and password to continue</p>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none text-foreground">Email</label>
            <input
              className="flex h-10 w-full rounded-md border border-input px-3 py-2 text-sm bg-background/50 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              type="email"
              placeholder="m.jackson@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium leading-none text-foreground">Password</label>
                {/* Optional: Add Forgot Password link later */}
            </div>
            <input
              className="flex h-10 w-full rounded-md border border-input px-3 py-2 text-sm bg-background/50 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="flex gap-4 pt-4">
            {/* Log In Button */}
            <button 
              onClick={handleSignIn}
              disabled={loading}
              className="flex-1 h-10 inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Log In'}
            </button>
            
            {/* Sign Up Button */}
            <button 
              onClick={handleSignUp}
              disabled={loading}
              className="flex-1 h-10 inline-flex items-center justify-center rounded-md border border-input bg-transparent text-foreground font-medium hover:bg-secondary disabled:opacity-50 transition-colors"
            >
              Sign Up
            </button>
          </div>
          
        </div>
      </div>
    </div>
  )
}