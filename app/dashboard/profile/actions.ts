'use server'

import { prisma } from '@/lib/prisma' // Import from your new file
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Remove: const prisma = new PrismaClient()

export async function updateProfile(formData: FormData) {
  // ... rest of your code remains exactly the same ...
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const name = formData.get('name') as string
  const pro = formData.get('pro') as string
  const ipiNumber = formData.get('ipiNumber') as string

  // update using the imported 'prisma' instance
  await prisma.user.update({
    where: { id: user.id },
    data: { name, pro, ipiNumber },
  })
}