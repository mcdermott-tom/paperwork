import { db } from '@/lib/db'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ReleaseForm } from './release-form' // Import the new component

async function getMySongs() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  return await db.song.findMany({
    where: { writers: { some: { userId: user.id } } },
    orderBy: { title: 'asc' },
    select: { id: true, title: true } // Optimization: only fetch what we need
  })
}

export default async function NewReleasePage() {
  const songs = await getMySongs()

  return (
    <div className="container mx-auto p-6 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Register New Release</CardTitle>
        </CardHeader>
        <CardContent>
          <ReleaseForm songs={songs} />
        </CardContent>
      </Card>
    </div>
  )
}