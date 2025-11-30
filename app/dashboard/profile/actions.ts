'use server'

import { prisma } from '@/lib/prisma'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache' // NEW: Forcing Next.js to refresh

export async function updateProfile(formData: FormData) {
  const cookieStore = await cookies()
  // Ensure the server client is created to get the user ID
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Authentication failed.' }
  }

  // Extract data from form
  const name = formData.get('name') as string
  const pro = formData.get('pro') as string
  const ipiNumber = formData.get('ipiNumber') as string

  try {
    // UPDATE: Use the correct user ID from Supabase Auth
    await prisma.user.update({
      where: { id: user.id },
      data: { name, pro, ipiNumber },
    })

    // CRITICAL: Tells Next.js to clear the cache for this path and re-render
    revalidatePath('/dashboard/profile')
    return { success: true }
  } catch (error) {
    console.error("PRISMA UPDATE ERROR:", error)
    return { success: false, error: 'Database update failed.' }
  }
}