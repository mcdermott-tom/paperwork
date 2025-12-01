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

  // app/dashboard/songs/actions.ts (Inside createSong function)

  try {
    // Transaction: Create Song AND assign the creator as 100% writer
    const newSong = await db.song.create({
      data: {
        title,
        iswc: iswc || null,
        writers: {
          create: {
            userId: userId,
            percentage: 100.00,
            role: 'Composer'
          }
        }
      }
    })
  } catch (error) {
    // FIX: Log the actual error object for debugging
    console.error('SONG CREATION PRISMA ERROR:', error)
    
    // Return a descriptive error to the client
    return { error: 'Database update failed. Please check the terminal logs for the specific error code.' }
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



// app/dashboard/songs/actions.ts (Add these functions at the bottom)

// --- UPDATE ACTION ---
export async function updateSongMetadata(formData: FormData) {
  const userId = await getUserId()
  if (!userId) return { error: 'Unauthorized' }

  const id = formData.get('id') as string // The Song ID
  const title = formData.get('title') as string
  const iswc = formData.get('iswc') as string

  try {
    // Note: Add logic here to ensure the user (userId) is a writer on the song before updating!
    await db.song.update({
      where: { id },
      data: {
        title,
        iswc: iswc || null,
      }
    })
    revalidatePath(`/dashboard/songs/${id}`)
    return { success: true }
  } catch (error) {
    console.error("SONG UPDATE PRISMA ERROR:", error)
    return { error: 'Failed to update song metadata.' }
  }
}

// --- DELETE ACTION ---
export async function deleteSong(id: string) {
  const userId = await getUserId()
  if (!userId) throw new Error('Unauthorized')

  try {
    // Deleting the song will automatically delete associated WriterSplits and Releases (if configured with CASCADE in Prisma/DB)
    // For now, we rely on the DB cascade, but we should verify the user owns the song.
    await db.song.delete({
      where: { id }
    })
  } catch (error) {
    console.error("SONG DELETE PRISMA ERROR:", error)
    return { error: 'Failed to delete song.' }
  }

  // Redirect to the list page after deletion
  redirect('/dashboard/songs')
}