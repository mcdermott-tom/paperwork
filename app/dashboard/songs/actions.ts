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

// HELPER: Strips non-alphanumeric characters for clean DB storage
const sanitizeISWC = (iswc: string | null | undefined) => {
    if (!iswc) return null;
    const cleaned = iswc.toUpperCase().replace(/[^A-Z0-9]/g, '');
    return cleaned || null;
};

// HELPER: Sanitize ISRC (US-XXX-24-12345 -> USXXX2412345)
const sanitizeISRC = (isrc: string | null | undefined) => {
    if (!isrc) return null;
    return isrc.toUpperCase().replace(/[^A-Z0-9]/g, '');
};


// --- SONG ACTIONS ---

export async function createSong(formData: FormData) {
  const userId = await getUserId()
  if (!userId) return { error: 'Unauthorized' }

  const title = formData.get('title') as string
  const iswc = formData.get('iswc') as string 
  const iswcClean = sanitizeISWC(iswc); 

  try {
    await db.song.create({
      data: {
        title,
        iswc: iswcClean,
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
    console.error('SONG CREATION PRISMA ERROR:', error)
    return { error: 'Database update failed.' }
  }

  revalidatePath('/dashboard/songs')
  redirect('/dashboard/songs')
}

export async function updateSongMetadata(formData: FormData) {
  const userId = await getUserId()
  if (!userId) return { error: 'Unauthorized' }

  const id = formData.get('id') as string 
  const title = formData.get('title') as string
  const iswc = formData.get('iswc') as string
  const iswcClean = sanitizeISWC(iswc); 

  try {
    await db.song.update({
      where: { id },
      data: {
        title,
        iswc: iswcClean,
      }
    })
    revalidatePath(`/dashboard/songs/${id}`)
    return { success: true }
  } catch (error) {
    console.error("SONG UPDATE PRISMA ERROR:", error)
    return { error: 'Failed to update song metadata.' }
  }
}

export async function deleteSong(id: string) {
  const userId = await getUserId()
  if (!userId) throw new Error('Unauthorized')

  try {
    await db.song.delete({
      where: { id }
    })
  } catch (error) {
    console.error("SONG DELETE PRISMA ERROR:", error)
    return { error: 'Failed to delete song.' }
  }

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
        isrc: sanitizeISRC(isrc),
      }
    })
    revalidatePath(`/dashboard/songs/${songId}`)
    return { success: true }
  } catch (error) {
    console.error("CREATE RELEASE ERROR:", error)
    return { error: 'Failed to create release.' }
  }
}

// ADDED: Missing Update Action
export async function updateRelease(formData: FormData) {
  const userId = await getUserId()
  if (!userId) return { error: 'Unauthorized' }

  const id = formData.get('id') as string
  const songId = formData.get('songId') as string // Needed for revalidation
  const title = formData.get('title') as string
  const isrc = formData.get('isrc') as string

  try {
    await db.release.update({
      where: { id },
      data: {
        title,
        isrc: sanitizeISRC(isrc),
      }
    })
    revalidatePath(`/dashboard/songs/${songId}`)
    return { success: true }
  } catch (error) {
    console.error("UPDATE RELEASE ERROR:", error)
    return { error: 'Failed to update release.' }
  }
}

// ADDED: Missing Delete Action
export async function deleteRelease(id: string, songId: string) {
  const userId = await getUserId()
  if (!userId) return { error: 'Unauthorized' }

  try {
    await db.release.delete({ where: { id } })
    revalidatePath(`/dashboard/songs/${songId}`)
    return { success: true }
  } catch (error) {
    console.error("DELETE RELEASE ERROR:", error)
    return { error: 'Failed to delete release.' }
  }
}