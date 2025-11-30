// app/dashboard/profile/actions.ts
'use server'

import { db } from '@/lib/db' // Ensure we use 'db', not 'prisma'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: FormData) {
  const cookieStore = await cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { success: false, error: 'Authentication failed: User not logged in.' }
  }

  const name = formData.get('name') as string
  const pro = formData.get('pro') as string
  const ipiNumber = formData.get('ipiNumber') as string

try {
    // FIX: Use 'upsert' to create the row if it's missing (Self-Healing)
    await db.user.upsert({
      where: { id: user.id },
      update: { 
        name, 
        pro, 
        ipiNumber 
      },
      create: { 
        id: user.id,
        email: user.email!, // We must provide email to create a new row
        name, 
        pro, 
        ipiNumber 
      },
    })

    revalidatePath('/dashboard/profile')
    return { success: true }
  } catch (error) {
    console.error("DATABASE UPDATE ERROR:", error)
    return { success: false, error: 'Failed to save to database.' }
  }
}