'use server'

import { db } from '@/lib/db'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import React from 'react'
import { renderToBuffer } from '@react-pdf/renderer' // SWITCHED to Buffer
import { LetterOfDirectionPDF } from '@/components/pdf/LetterOfDirection'
import { Resend } from 'resend'

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY)

export async function generateLOD(songId: string) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  // 1. Auth Check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email) return { error: 'Unauthorized' }

  // 2. Fetch Data
  const song = await db.song.findUnique({
    where: { id: songId },
    include: { writers: { include: { user: true } } } 
  })

  if (!song) return { error: 'Song not found' }

  const signer = await db.user.findUnique({ 
    where: { id: user.id } 
  })

  if (!signer) return { error: 'User profile not found.' }

  // 3. Prepare PDF Props
  const agreementDate = new Date().toISOString().split('T')[0]
  const adminCompany = {
    name: "Paperwork Administration, LLC",
    address: "123 Music Row, Nashville, TN 37203" 
  }

  const pdfProps = {
    user: {
      legalName: signer.name || 'Unknown',
      artistName: signer.name || 'Unknown',
      address: 'Address on File',
      ipiNumber: signer.ipiNumber || undefined
    },
    adminCompany,
    date: agreementDate
  }

  try {
    // 4. Generate the PDF Buffer
    const pdfBuffer = await renderToBuffer(<LetterOfDirectionPDF {...pdfProps} />)
    
    // 5. Send Email via Resend
    // IN PRODUCTION: You would change 'to' to 'submissions@themlc.com'
    const { data, error } = await resend.emails.send({
      from: 'Paperwork Admin <admin@paperworkmusic.com>', // Ensure this domain is verified in Resend
      to: [user.email], // Sending to YOU (the user) for testing
      subject: `Action Required: LOD for ${song.title} (${signer.name})`,
      html: `
        <h1>New Letter of Direction Generated</h1>
        <p><strong>Artist:</strong> ${signer.name}</p>
        <p><strong>Song:</strong> ${song.title}</p>
        <p>Attached is the signed Letter of Direction authorizing Paperwork to collect unclaimed royalties.</p>
      `,
      attachments: [
        {
          filename: `LOD_${song.title.replace(/\s/g, '_')}_${agreementDate}.pdf`,
          content: pdfBuffer,
        },
      ],
    })

    if (error) {
      console.error('Resend Error:', error)
      return { error: 'Failed to send email.' }
    }

    // 6. Update DB to mark as "Signed"
    await db.writerSplit.updateMany({
      where: {
        songId: song.id,
        userId: user.id
      },
      data: {
        adminStatus: 'SIGNED_LOD'
      }
    })

    console.log(`[SIGNED & SENT] LOD for ${song.title} sent to ${user.email}`)

    return { success: true }

  } catch (error) {
    console.error('LOD Process Error:', error)
    return { error: 'Failed to generate contract.' }
  }
}