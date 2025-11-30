'use server'

import { db } from '@/lib/db'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// Helper to get current user ID
async function getUserId() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id
}

// --- SONG ACTIONS ---

export async function createSong(formData: FormData) {
  const userId = await getUserId()
  if (!userId) return { error: 'Unauthorized' }

  const title = formData.get('title') as string
  const iswc = formData.get('iswc') as string

  try {
    // Transaction: Create Song AND assign the creator as 100% writer
    const newSong = await db.song.create({
      data: {
        title,
        iswc: iswc || null,
        writers: {
          create: {
            userId: userId,
            percentage: 100.00, // Default to 100% ownership
            role: 'Composer'     // Default role
          }
        }
      }
    })
  } catch (error) {
    return { error: 'Failed to create song' }
  }

  revalidatePath('/dashboard/songs')
  redirect('/dashboard/songs')
}

// --- RELEASE ACTIONS ---

export async function createRelease(formData: FormData) {
  const userId = await getUserId()
  if (!userId) return { error: 'Unauthorized' }

  const songId = formData.get('songId') as string
  const title = formData.get('title') as string
  const isrc = formData.get('isrc') as string

  try {
    await db.release.create({
      data: {
        songId,
        title,
        isrc: isrc || null,
        // For MVP, we aren't creating MasterSplits yet, just the record
      }
    })
    
    revalidatePath(`/songs/${songId}`)
    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: 'Failed to create release' }
  }
}