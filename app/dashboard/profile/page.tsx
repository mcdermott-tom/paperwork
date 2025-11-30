// app/dashboard/profile/page.tsx

import { db } from '@/lib/db'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import ProfileForm from './profile-form' // Import the new Client Component

// 1. Server-side data fetch function
async function getUserProfileData() {
  // Fix: Your compiler requires 'await' here due to dependency structure
  const cookieStore = await cookies() 

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Fetch the profile data
  const profile = await db.user.findUnique({ 
    where: { id: user.id },
    select: { name: true, pro: true, ipiNumber: true } // Select only needed fields
  })

  // Security Check: Authorization—we should not proceed if the row is missing
  if (!profile) {
    // If the user exists in auth.users but not in public.User, redirect to a setup page or return null
    return null
  }
  
  return profile
}

// Main component is now a Server Component (async function)
export default async function ProfilePage() {
  const userData = await getUserProfileData()

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <ProfileForm initialData={userData} />
    </div>
  )
}