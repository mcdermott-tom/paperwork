'use server'

import { db } from '@/lib/db'
import { createServerClient } from '@supabase/ssr'
import { cookies, headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { renderToStream } from '@react-pdf/renderer'
import { SplitSheetPDF } from '@/components/SplitSheetPDF' 
import { createAuditLog } from '@/lib/logger'

// Helper to get IP
async function getIp() {
  const headersList = await headers()
  const forwardedFor = headersList.get('x-forwarded-for')
  const realIp = headersList.get('x-real-ip')
  return forwardedFor?.split(',')[0] ?? realIp ?? 'Unknown'
}

// Helper to get User Agent
async function getUserAgent() {
  const headersList = await headers()
  return headersList.get('user-agent') ?? 'Unknown'
}

export async function signAndFinalizeSplitSheet(songId: string) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    // 1. Fetch Data
    const song = await db.song.findUnique({
      where: { id: songId },
      include: { 
        writers: { include: { user: true } },
        releases: true
      }
    })

    if (!song) return { error: 'Song not found' }

    // 2. Generate PDF Stream
    const pdfStream = await renderToStream(
      <SplitSheetPDF song={song} writers={song.writers} />
    )

    // 3. Convert Stream to Buffer (FIXED TYPING)
    // We explicitly define this as a Buffer array to satisfy Buffer.concat
    const chunks: Buffer[] = []
    
    for await (const chunk of pdfStream) {
      // Force conversion to Buffer to handle string|Buffer chunks safely
      chunks.push(Buffer.from(chunk))
    }
    
    const pdfBuffer = Buffer.concat(chunks)

    // 4. Upload to Supabase Storage ('contracts' bucket)
    const fileName = `${songId}_v${Date.now()}.pdf`
    
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('contracts')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false
      })

    if (uploadError) throw new Error(`Upload Failed: ${uploadError.message}`)

    // 5. Lock the Song
    await db.song.update({
        where: { id: songId },
        data: { isLocked: true }
    });

    // 6. Create the Immutable Record
    const splitSheet = await db.splitSheet.create({
      data: {
        songId: songId,
        pdfUrl: uploadData.path,
        signedByUserId: user.id,
        signedIp: await getIp(),
        userAgent: await getUserAgent(),
        version: 1 
      }
    })

    // 7. Audit Log
    await createAuditLog({
        userId: user.id,
        action: 'CONTRACT_SIGNED',
        entity: 'SplitSheet',
        entityId: splitSheet.id,
        newData: splitSheet,
        oldData: undefined,
    });

    revalidatePath(`/dashboard/songs/${songId}`)
    return { success: true }

  } catch (error) {
    console.error("SIGNING ERROR:", error)
    return { error: 'Failed to sign contract. Ensure "contracts" bucket exists in Supabase.' }
  }
}