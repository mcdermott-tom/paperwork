'use server'

import { db } from '@/lib/db'
import { createServerClient } from '@supabase/ssr'
import { cookies, headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { renderToStream } from '@react-pdf/renderer'
import { SplitSheetPDF } from '@/components/SplitSheetPDF' 
import { createAuditLog } from '@/lib/logger'

async function getIp() {
  const headersList = await headers()
  const forwardedFor = headersList.get('x-forwarded-for')
  const realIp = headersList.get('x-real-ip')
  return forwardedFor?.split(',')[0] ?? realIp ?? 'Unknown'
}

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
    const song = await db.song.findUnique({
      where: { id: songId },
      include: { 
        writers: { include: { user: true } },
        releases: true
      }
    })

    if (!song) return { error: 'Song not found' }

    // Generate PDF
    const pdfStream = await renderToStream(
      <SplitSheetPDF song={song} writers={song.writers} />
    )

    const chunks: Buffer[] = []
    for await (const chunk of pdfStream) {
      chunks.push(Buffer.from(chunk))
    }
    const pdfBuffer = Buffer.concat(chunks)

    // Upload
    const fileName = `${songId}_v${Date.now()}.pdf`
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('contracts')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false
      })

    if (uploadError) throw new Error(`Upload Failed: ${uploadError.message}`)

    // Lock Song
    await db.song.update({
        where: { id: songId },
        data: { isLocked: true }
    });

    // Create Record
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

    // Audit Log
    await createAuditLog({
        userId: user.id,
        action: 'CONTRACT_SIGNED',
        entity: 'SplitSheet',
        entityId: splitSheet.id,
        newData: splitSheet,
        oldData: undefined,
    });

    // Revalidate the page so the button disappears/changes state
    revalidatePath(`/dashboard/songs/${songId}`)
    
    return { success: true }

  } catch (error: any) {
    console.error("SIGNING ERROR:", error)
    return { error: error.message || 'Failed to sign contract.' }
  }
}