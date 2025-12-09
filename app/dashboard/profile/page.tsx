// app/dashboard/profile/page.tsx

import { db } from '@/lib/db'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import ProfileForm from './profile-form' 

// 1. Server-side data fetch function
async function getUserProfileData() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Fetch the profile data
  // FIXED: Removed 'spotifyArtistId' from selection as it was deleted from schema
  const profile = await db.user.findUnique({ 
    where: { id: user.id },
    select: { 
      name: true, 
      pro: true, 
      ipiNumber: true,
    } 
  })

  if (!profile) return null
  
  return profile
}

// Main component (Server Component)
export default async function ProfilePage() {
  const userData = await getUserProfileData()

  return (
    <div className="container mx-auto p-6 max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">Artist Settings</h1>
      
      {/* FIXED: Removed <SpotifyConnect> 
         We are no longer syncing entire artist profiles. 
         Song data is now added via the Search Dashboard.
      */}

      {/* 2. EXISTING PROFILE FORM */}
      <ProfileForm initialData={userData} />
    </div>
  )
}