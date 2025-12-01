'use server'

import { db } from '@/lib/db'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

// 1. Helper: Get Client Credentials Token
async function getSpotifyToken() {
  const basic = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString('base64');

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store' // Don't cache the token request
  });

  const data = await response.json();
  return data.access_token;
}

// 2. Action: Search for an Artist
export async function searchSpotifyArtists(query: string) {
  if (!query) return [];
  
  const token = await getSpotifyToken();
  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist&limit=5`, 
    { headers: { Authorization: `Bearer ${token}` } }
  );

  const data = await response.json();
  
  // Return a simplified object for the frontend
  return data.artists.items.map((artist: any) => ({
    id: artist.id,
    name: artist.name,
    image: artist.images[0]?.url || null, // Get the largest image
    genres: artist.genres.slice(0, 3).join(', ')
  }));
}

// 3. Action: Claim Artist
export async function claimArtist(artistId: string, avatarUrl: string) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    await db.user.update({
      where: { id: user.id },
      data: {
        spotifyArtistId: artistId,
        avatarUrl: avatarUrl
      }
    })
    revalidatePath('/dashboard/profile')
    return { success: true }
  } catch (error) {
    return { error: 'Failed to link artist profile.' }
  }
}