// app/dashboard/profile/page.tsx

import { db } from '@/lib/db'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import ProfileForm from './profile-form' 
import { SpotifyConnect } from './spotify-search' // NEW IMPORT

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
  const profile = await db.user.findUnique({ 
    where: { id: user.id },
    // UPDATE: Select the new Spotify fields
    select: { 
      name: true, 
      pro: true, 
      ipiNumber: true,
      spotifyArtistId: true 
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
      
      {/* 1. SPOTIFY CONNECTION CARD */}
      <SpotifyConnect currentArtistId={userData?.spotifyArtistId} />

      {/* 2. EXISTING PROFILE FORM */}
      <ProfileForm initialData={userData} />
    </div>
  )
}