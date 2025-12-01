import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Header } from '@/components/header'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // 1. Safety Check for Env Vars (Prevents 500 error if keys are missing)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error("Supabase keys missing in Dashboard Layout");
    // Fail gracefully to login instead of crashing
    redirect('/login');
  }

  const cookieStore = await cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  // 2. Check Auth securely on the Node.js server
  const { data: { user } } = await supabase.auth.getUser()

  // 3. Bounce them if not logged in
  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">{children}</main>
    </div>
  )
}