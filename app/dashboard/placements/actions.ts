'use server'

import { db } from '@/lib/db'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

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

// Update specific status type (fee or pro)
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