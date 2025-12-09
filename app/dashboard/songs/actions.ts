'use server'

import { db } from '@/lib/db'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { Resend } from 'resend' 
import { createAuditLog } from '@/lib/logger'; 

const resend = new Resend(process.env.RESEND_API_KEY);

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

// NEW HELPER: Checks if the Song is locked
async function checkSongLock(songId: string) {
    // @ts-ignore -- DB schema updated but local TS cache might be stale
    const song = await db.song.findUnique({ where: { id: songId }, select: { isLocked: true } });
    // @ts-ignore
    return song?.isLocked ?? false;
}

// HELPER: Strips non-alphanumeric characters for clean DB storage
const sanitizeISWC = (iswc: string | null | undefined) => {
    if (!iswc) return null;
    const cleaned = iswc.toUpperCase().replace(/[^A-Z0-9]/g, '');
    return cleaned || null;
};

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
    const newSong = await db.song.create({
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
    
    await createAuditLog({
        userId: userId,
        action: 'SONG_CREATED',
        entity: 'Song',
        entityId: newSong.id,
        newData: newSong,
        oldData: undefined,
    });

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

  // GUARD: Check if Song is Locked
  const isLocked = await checkSongLock(id);
  if (isLocked) return { error: 'Song is locked. Create a new version to make changes.' };

  try {
    const oldSong = await db.song.findUnique({ where: { id } });

    const newSong = await db.song.update({
      where: { id },
      data: {
        title,
        iswc: iswcClean,
      }
    })
    
    await createAuditLog({
        userId: userId,
        action: 'METADATA_UPDATED',
        entity: 'Song',
        entityId: id,
        oldData: oldSong,
        newData: newSong,
    });

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

  // GUARD: Check if Song is Locked
  const isLocked = await checkSongLock(id);
  if (isLocked) return { error: 'Song is locked. Cannot be deleted.' };


  try {
    const deletedSong = await db.song.delete({ where: { id } });
    
    await createAuditLog({
        userId: userId,
        action: 'SONG_DELETED',
        entity: 'Song',
        entityId: id,
        oldData: deletedSong,
        newData: undefined,
    });
    
  } catch (error) {
    console.error("SONG DELETE PRISMA ERROR:", error)
    return { error: 'Failed to delete song.' }
  }

  redirect('/dashboard/songs')
}


// --- WRITER / SPLIT ACTIONS ---

export async function addWriter(formData: FormData) {
  const userId = await getUserId()
  if (!userId) return { error: 'Unauthorized' }

  const songId = formData.get('songId') as string
  const email = formData.get('email') as string
  const role = formData.get('role') as string
  const percentage = parseFloat(formData.get('percentage') as string)
  
  // GUARD: Check if Song is Locked
  const isLocked = await checkSongLock(songId);
  if (isLocked) return { error: 'Song is locked. Cannot add writers.' };


  try {
    const [song, inviter] = await Promise.all([
        db.song.findUnique({ where: { id: songId }, select: { title: true } }),
        db.user.findUnique({ where: { id: userId }, select: { name: true, email: true } })
    ]);

    if (!song) return { error: 'Song not found.' }

    const writerUser = await db.user.findUnique({ where: { email } })

    if (writerUser) {
      const existingSplit = await db.writerSplit.findFirst({
        where: { songId, userId: writerUser.id }
      })
      if (existingSplit) return { error: 'This user is already a writer on this song.' }
    }

    const newSplit = await db.writerSplit.create({
      data: {
        songId,
        role,
        percentage: percentage,
        userId: writerUser ? writerUser.id : null, 
        email: writerUser ? null : email,          
      }
    })
    
    await createAuditLog({
        userId: userId,
        action: 'SPLIT_ADDED',
        entity: 'WriterSplit',
        entityId: newSplit.id,
        newData: newSplit,
        oldData: undefined,
    });

    try {
        const apiKey = process.env.RESEND_API_KEY;
        if (apiKey && !writerUser) {
            const artistName = inviter?.name || inviter?.email || "A collaborator";
            const inviteLink = "http://localhost:3000/login";

            await resend.emails.send({
                from: 'Paperwork <onboarding@resend.dev>',
                to: email,
                subject: `Royalty Invite: "${song.title}"`,
                html: `
                  <div style="font-family: sans-serif; font-size: 16px; color: #333;">
                    <h1>You have pending royalties!</h1>
                    <p><strong>${artistName}</strong> has added you as a <strong>${role}</strong> on the song <strong>"${song.title}"</strong>.</p>
                    <p>You have been assigned <strong>${percentage}%</strong> ownership.</p>
                    <br/>
                    <a href="${inviteLink}" style="background-color: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Accept Royalties & Sign Up</a>
                  </div>
                `
            });
        }
    } catch (emailError) {
        console.error("EMAIL SEND FAILED (Non-fatal):", emailError);
    }

    revalidatePath(`/dashboard/songs/${songId}`)
    return { success: true }

  } catch (error) {
    console.error("ADD WRITER ERROR:", error)
    return { error: 'Failed to add writer.' }
  }
}

export async function updateSplit(formData: FormData) {
  const userId = await getUserId()
  if (!userId) return { error: 'Unauthorized' }

  const splitId = formData.get('splitId') as string
  const songId = formData.get('songId') as string
  const role = formData.get('role') as string
  const percentage = parseFloat(formData.get('percentage') as string)
  
  // GUARD: Check if Song is Locked
  const isLocked = await checkSongLock(songId);
  if (isLocked) return { error: 'Song is locked. Cannot update splits.' };

  try {
    const oldSplit = await db.writerSplit.findUnique({ where: { id: splitId } });

    const newSplit = await db.writerSplit.update({
      where: { id: splitId },
      data: { role, percentage }
    })

    await createAuditLog({
        userId: userId,
        action: 'SPLIT_UPDATED',
        entity: 'WriterSplit',
        entityId: splitId,
        oldData: oldSplit,
        newData: newSplit,
    });
    
    revalidatePath(`/dashboard/songs/${songId}`)
    return { success: true }
  } catch (error) {
    return { error: 'Failed to update split.' }
  }
}

export async function deleteSplit(splitId: string, songId: string) {
  const userId = await getUserId()
  if (!userId) return { error: 'Unauthorized' }
  
  // GUARD: Check if Song is Locked
  const isLocked = await checkSongLock(songId);
  if (isLocked) return { error: 'Song is locked. Cannot delete splits.' };


  try {
    const deletedSplit = await db.writerSplit.delete({ where: { id: splitId } })
    
    await createAuditLog({
        userId: userId,
        action: 'SPLIT_DELETED',
        entity: 'WriterSplit',
        entityId: splitId,
        oldData: deletedSplit,
        newData: undefined,
    });
    
    revalidatePath(`/dashboard/songs/${songId}`)
    return { success: true }
  } catch (error) {
    return { error: 'Failed to remove writer.' }
  }
}


// --- RELEASE ACTIONS ---
// (No lock check needed here since Release metadata is considered secondary to the composition contract)

export async function createRelease(formData: FormData) {
  const userId = await getUserId()
  if (!userId) return { error: 'Unauthorized' }

  const songId = formData.get('songId') as string
  const title = formData.get('title') as string
  const isrc = formData.get('isrc') as string

  try {
    const newRelease = await db.release.create({
      data: {
        songId,
        title,
        isrc: sanitizeISRC(isrc),
      }
    })
    
    await createAuditLog({
        userId: userId,
        action: 'RELEASE_CREATED',
        entity: 'Release',
        entityId: newRelease.id,
        newData: newRelease,
        oldData: undefined,
    });
    
    revalidatePath(`/dashboard/songs/${songId}`)
    return { success: true }
  } catch (error) {
    console.error("CREATE RELEASE ERROR:", error)
    return { error: 'Failed to create release.' }
  }
}

export async function updateRelease(formData: FormData) {
  const userId = await getUserId()
  if (!userId) return { error: 'Unauthorized' }

  const id = formData.get('id') as string
  const songId = formData.get('songId') as string
  const title = formData.get('title') as string
  const isrc = formData.get('isrc') as string

  try {
    const oldRelease = await db.release.findUnique({ where: { id } });

    const newRelease = await db.release.update({
      where: { id },
      data: {
        title,
        isrc: sanitizeISRC(isrc),
      }
    })
    
    await createAuditLog({
        userId: userId,
        action: 'RELEASE_UPDATED',
        entity: 'Release',
        entityId: id,
        oldData: oldRelease,
        newData: newRelease,
    });
    
    revalidatePath(`/dashboard/songs/${songId}`)
    return { success: true }
  } catch (error) {
    console.error("UPDATE RELEASE ERROR:", error)
    return { error: 'Failed to update release.' }
  }
}

export async function deleteRelease(id: string, songId: string) {
  const userId = await getUserId()
  if (!userId) return { error: 'Unauthorized' }

  try {
    const deletedRelease = await db.release.delete({ where: { id } })
    
    await createAuditLog({
        userId: userId,
        action: 'RELEASE_DELETED',
        entity: 'Release',
        entityId: id,
        oldData: deletedRelease,
        newData: undefined,
    });
    
    revalidatePath(`/dashboard/songs/${songId}`)
    return { success: true }
  } catch (error) {
    return { error: 'Failed to delete release.' }
  }
}


// --- NEW: CLAIM SONG ACTION ---
export async function claimSong(songId: string) {
  const userId = await getUserId()
  if (!userId) return { error: 'Unauthorized' }

  try {
    // 1. Check if they already claimed it
    const existingSplit = await db.writerSplit.findUnique({
        where: {
            userId_songId: { userId, songId }
        }
    });

    if (existingSplit) {
        // If they already have it, just go there
        redirect(`/dashboard/songs/${songId}`);
    }

    // 2. Create the connection
    const newSplit = await db.writerSplit.create({
      data: {
        songId,
        userId,
        percentage: 0.00, // Default to 0% so they are forced to input the real number
        role: 'Composer', // Default role
        adminStatus: 'UNCLAIMED'
      }
    });
    
    await createAuditLog({
        userId: userId,
        action: 'SONG_CLAIMED', // New Audit Action
        entity: 'WriterSplit',
        entityId: newSplit.id,
        newData: newSplit,
        oldData: undefined,
    });

  } catch (error) {
    // If the error is a NEXT_REDIRECT, re-throw it so Next.js handles the navigation
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
        throw error;
    }
    console.error("CLAIM SONG ERROR:", error)
    return { error: 'Failed to claim song.' }
  }

  // 3. Send them to the detail page to finish setup
  revalidatePath('/dashboard/songs')
  redirect(`/dashboard/songs/${songId}`)
}