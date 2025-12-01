'use server'

import { db } from '@/lib/db'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { Resend } from 'resend' 
import { createAuditLog } from '@/lib/logger'; // Assumed function

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

// HELPER: Strips non-alphanumeric characters for clean DB storage
const sanitizeISWC = (iswc: string | null | undefined) => {
    if (!iswc) return null;
    const cleaned = iswc.toUpperCase().replace(/[^A-Z0-9]/g, '');
    return cleaned || null;
};

// HELPER: Sanitize ISRC
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
    
    // LOG: Log the creation
    await createAuditLog({
        userId: userId,
        action: 'SONG_CREATED',
        entity: 'Song',
        entityId: newSong.id,
        newData: newSong, // Pass the created object
        oldData: undefined, // Explicitly use undefined for no old data
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

  try {
    // 1. Fetch current state for oldData log
    const oldSong = await db.song.findUnique({ where: { id } });

    const newSong = await db.song.update({
      where: { id },
      data: {
        title,
        iswc: iswcClean,
      }
    })
    
    // 2. Log the update
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

  try {
    const deletedSong = await db.song.delete({ where: { id } });
    
    // LOG: Log the deletion
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


// --- WRITER / SPLIT ACTIONS (UPDATED) ---

export async function addWriter(formData: FormData) {
  const userId = await getUserId()
  if (!userId) return { error: 'Unauthorized' }

  const songId = formData.get('songId') as string
  const email = formData.get('email') as string
  const role = formData.get('role') as string
  const percentage = parseFloat(formData.get('percentage') as string)

  try {
    // 1. Fetch Context
    const [song, inviter] = await Promise.all([
        db.song.findUnique({ where: { id: songId }, select: { title: true } }),
        db.user.findUnique({ where: { id: userId }, select: { name: true, email: true } })
    ]);

    if (!song) return { error: 'Song not found.' }

    // 2. Check Database for User
    const writerUser = await db.user.findUnique({ where: { email } })

    // 3. Prevent Duplicate Logic
    if (writerUser) {
      const existingSplit = await db.writerSplit.findFirst({
        where: { songId, userId: writerUser.id }
      })
      if (existingSplit) return { error: 'This user is already a writer on this song.' }
    }

    // 4. Create the split
    const newSplit = await db.writerSplit.create({
      data: {
        songId,
        role,
        percentage: percentage,
        userId: writerUser ? writerUser.id : null, 
        email: writerUser ? null : email,          
      }
    })
    
    // 5. Log the action
    await createAuditLog({
        userId: userId,
        action: 'SPLIT_ADDED',
        entity: 'WriterSplit',
        entityId: newSplit.id,
        newData: newSplit,
        oldData: undefined,
    });

    // 6. SAFELY SEND EMAIL (Non-fatal)
    try {
        const apiKey = process.env.RESEND_API_KEY;
        if (apiKey) {
            const artistName = inviter?.name || inviter?.email || "A collaborator";
            const inviteLink = "http://localhost:3000/login";

            if (!writerUser) {
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
        } else {
            console.warn("Resend API Key missing - skipping email.");
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

  try {
    // 1. Fetch old data before update
    const oldSplit = await db.writerSplit.findUnique({ where: { id: splitId } });

    // 2. Perform Update
    const newSplit = await db.writerSplit.update({
      where: { id: splitId },
      data: { role, percentage }
    })

    // 3. Log the change
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

  try {
    const deletedSplit = await db.writerSplit.delete({ where: { id: splitId } })
    
    // Log the deletion
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
    
    // Log the creation
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
    
    // Log the update
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
    
    // Log the deletion
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