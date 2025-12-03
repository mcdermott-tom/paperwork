import { db } from '@/lib/db'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { PlacementBoard } from './placement-client'

async function getPlacementData() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // 1. Fetch Placements (Money)
  const placements = await db.placement.findMany({
    where: { song: { writers: { some: { userId: user.id } } } },
    include: { song: { select: { title: true } } },
    orderBy: { createdAt: 'desc' }
  })

  // 2. Fetch Songs (For the dropdown)
  const songs = await db.song.findMany({
    where: { writers: { some: { userId: user.id } } },
    select: { id: true, title: true },
    orderBy: { title: 'asc' }
  })

  // Convert Decimals to numbers for client safety and pass through all new status fields
  const cleanPlacements = placements.map(p => ({
    ...p,
    fee: p.fee.toNumber(),
    // Explicitly passing these ensures they aren't lost if spread behavior changes, 
    // though ...p covers them in most configs.
    feeStatus: p.feeStatus, 
    proStatus: p.proStatus,
    notes: p.notes
  }))

  return { placements: cleanPlacements, songs }
}

export default async function PlacementsPage() {
  const data = await getPlacementData()

  if (!data) return <div>Please log in.</div>

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Placement Tracker</h1>
      </div>
      <PlacementBoard placements={data.placements} songs={data.songs} />
    </div>
  )
}