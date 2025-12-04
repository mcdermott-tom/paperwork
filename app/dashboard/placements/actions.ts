'use server'

import { db } from '@/lib/db'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

// --- 1. TYPES ---
export type IncomeItem = {
  id: string
  type: 'PLACEMENT' | 'SPLIT'
  title: string     // Song Title (Split) or Track Title (Placement)
  subtitle: string  // Client (Placement) or "Writer Share" (Split)
  amount: number    // Fee (Placement) or Advance (Split)
  status: string
  date: Date
  songId?: string   // Useful for linking back to the song
}

// --- 2. AUTH HELPER ---
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

// --- 3. THE UNIFIER FUNCTION (New) ---
export async function getUnifiedIncome(): Promise<IncomeItem[]> {
  const userId = await getUserId()
  if (!userId) return []

  // A. Fetch Placements (Linked to songs where user is a writer)
  const placements = await db.placement.findMany({
    where: { song: { writers: { some: { userId } } } },
    include: { song: { select: { title: true } } },
    orderBy: { createdAt: 'desc' }
  })

  // B. Fetch Splits (Directly owned by the user)
  // Note: Using 'writerSplit' based on your schema
  const splits = await db.writerSplit.findMany({
    where: { userId },
    include: { song: { select: { title: true } } },
    orderBy: { createdAt: 'desc' }
  })

  // C. Normalize Placements
  const normalizedPlacements: IncomeItem[] = placements.map(p => ({
    id: p.id,
    type: 'PLACEMENT',
    title: p.song.title, 
    subtitle: `${p.client} (${p.licenseType})`, 
    amount: p.fee.toNumber(),
    status: p.feeStatus, // pending, invoiced, paid
    date: p.createdAt,
    songId: p.songId
  }))

  // D. Normalize Splits
  const normalizedSplits: IncomeItem[] = splits.map(s => ({
    id: s.id,
    type: 'SPLIT',
    title: s.song.title,
    subtitle: `${s.percentage.toNumber()}% ${s.role} Share`,
    amount: s.advance.toNumber(), // Showing the "Upfront" value here
    status: s.status, // Active, Recouping
    date: s.createdAt,
    songId: s.songId
  }))

  // E. Merge and Sort
  return [...normalizedPlacements, ...normalizedSplits].sort(
    (a, b) => b.date.getTime() - a.date.getTime()
  )
}

// --- 4. CRUD ACTIONS (Restored) ---

export async function createPlacement(formData: FormData) {
  const userId = await getUserId()
  if (!userId) return { error: 'Unauthorized' }

  // Extract and Validate
  const songId = formData.get('songId') as string
  const client = formData.get('client') as string
  const project = formData.get('project') as string
  const licenseType = formData.get('licenseType') as string
  const fee = parseFloat(formData.get('fee') as string) || 0
  const feeStatus = formData.get('feeStatus') as string
  const proStatus = formData.get('proStatus') as string
  const notes = formData.get('notes') as string

  if (!songId || !client) {
      return { error: "Missing required fields (Song or Client)" }
  }

  try {
    await db.placement.create({
      data: { 
          songId, 
          client, 
          project, 
          licenseType, 
          fee, 
          feeStatus, 
          proStatus, 
          notes 
      }
    })
    revalidatePath('/dashboard/placements')
    return { success: true }
  } catch (error) {
    console.error("CREATE PLACEMENT DB ERROR:", error)
    return { error: 'Database failed to save placement.' }
  }
}

// RESTORED: This is the function that was missing
export async function updatePlacementField(id: string, field: 'feeStatus' | 'proStatus', value: string) {
  const userId = await getUserId()
  if (!userId) return { error: 'Unauthorized' }

  try {
    await db.placement.update({
      where: { id },
      data: { [field]: value }
    })
    revalidatePath('/dashboard/placements')
    return { success: true }
  } catch (error) {
    return { error: 'Failed to update status.' }
  }
}

export async function deletePlacement(id: string) {
  const userId = await getUserId()
  if (!userId) return { error: 'Unauthorized' }

  try {
    await db.placement.delete({ where: { id } })
    revalidatePath('/dashboard/placements')
    return { success: true }
  } catch (error) {
    return { error: 'Failed to delete placement.' }
  }
}