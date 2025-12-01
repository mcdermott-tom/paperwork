import { db } from '@/lib/db'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Music, Disc, ArrowRight } from 'lucide-react'
import { ReleaseArtwork } from '@/components/artwork' // Ensure this component exists

// --- SERVER DATA FETCHING ---
async function getDashboardData() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  // 1. Fetch Recent Songs (Composition)
  const recentSongs = await db.song.findMany({
    where: { writers: { some: { userId: user.id } } },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { _count: { select: { releases: true } } }
  })

  // 2. Fetch Recent Releases (Masters)
  const recentReleases = await db.release.findMany({
    where: { song: { writers: { some: { userId: user.id } } } },
    orderBy: { createdAt: 'desc' },
    take: 5,
    // FIX: Include coverArtUrl
    include: { song: { select: { title: true } } }
  })

  // 3. Calculate Catalog Health (Songs with ISWC vs Total)
  const totalSongs = await db.song.count({
    where: { writers: { some: { userId: user.id } } }
  })
  
  const songsWithIswc = await db.song.count({
    where: { 
      writers: { some: { userId: user.id } },
      iswc: { not: null } 
    }
  })

  const healthScore = totalSongs > 0 ? Math.round((songsWithIswc / totalSongs) * 100) : 0

  return { recentSongs, recentReleases, healthScore, totalSongs, songsWithIswc }
}

// HELPER: Simple format for display
const formatCode = (code: string | null) => code || <span className="text-gray-300 italic">Missing</span>

export default async function DashboardPage() {
  const data = await getDashboardData()

  if (!data) return <div>Please log in.</div>

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Artist Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* QUADRANT 1: RECENT COMPOSITIONS (Real Data) */}
        <Card className="col-span-1 min-h-[350px]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Songs</CardTitle>
            <Link href="/dashboard/songs" className="text-sm text-blue-600 hover:underline">View All</Link>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow><TableHead>Title</TableHead><TableHead>ISWC</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {data.recentSongs.length === 0 ? (
                  <TableRow><TableCell colSpan={2} className="text-center text-gray-500 h-24">No songs yet.</TableCell></TableRow>
                ) : (
                  data.recentSongs.map((song) => (
                    <TableRow key={song.id}>
                      <TableCell className="font-medium">{song.title}</TableCell>
                      <TableCell className="font-mono text-xs">{formatCode(song.iswc)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* QUADRANT 2: CATALOG HEALTH (The "Gamification") */}
        <Card className="col-span-1 min-h-[350px]">
          <CardHeader>
            <CardTitle>Catalog Health</CardTitle>
            <CardDescription>Metadata completion score</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center h-[200px] space-y-4">
            
            {/* Circular or Bar Progress */}
            <div className="relative flex items-center justify-center">
              <div className="text-5xl font-bold text-slate-900">{data.healthScore}%</div>
            </div>
            
            <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
              <div 
                className={`h-full rounded-full ${data.healthScore === 100 ? 'bg-green-500' : 'bg-blue-600'}`} 
                style={{ width: `${data.healthScore}%` }}
              ></div>
            </div>

            <p className="text-center text-sm text-gray-500">
              {data.songsWithIswc} of {data.totalSongs} songs have valid ISWCs.
              {data.healthScore < 100 && " Add missing codes to reach 100%."}
            </p>

          </CardContent>
        </Card>

        {/* QUADRANT 3: RECENT RELEASES (Real Data with Artwork) */}
        <Card className="col-span-1 min-h-[350px]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Releases</CardTitle>
            <Link href="/dashboard/releases" className="text-sm text-blue-600 hover:underline">View All</Link>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow><TableHead>Title</TableHead><TableHead>ISRC</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {data.recentReleases.length === 0 ? (
                  <TableRow><TableCell colSpan={2} className="text-center text-gray-500 h-24">No releases yet.</TableCell></TableRow>
                ) : (
                  data.recentReleases.map((release) => (
                    <TableRow key={release.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {/* NEW: Display Artwork */}
                          <ReleaseArtwork url={release.coverArtUrl} size="sm" />
                          <div>
                            <div className="font-medium">{release.title}</div>
                            <div className="text-xs text-gray-500">{release.song.title}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{formatCode(release.isrc)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* QUADRANT 4: QUICK ACTIONS */}
        <Card className="col-span-1 min-h-[350px] bg-slate-50 border-dashed">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            
            <Link href="/dashboard/songs/new">
              <Button className="w-full h-16 text-lg justify-start gap-4" variant="outline">
                <div className="bg-blue-100 p-2 rounded-full"><Music className="h-6 w-6 text-blue-600" /></div>
                Register New Song
                <ArrowRight className="ml-auto h-5 w-5 text-gray-400" />
              </Button>
            </Link>

            <Link href="/dashboard/releases/new">
              <Button className="w-full h-16 text-lg justify-start gap-4" variant="outline">
                <div className="bg-green-100 p-2 rounded-full"><Disc className="h-6 w-6 text-green-600" /></div>
                Add Master Release
                <ArrowRight className="ml-auto h-5 w-5 text-gray-400" />
              </Button>
            </Link>

            <Link href="/dashboard/ingest">
              <Button className="w-full h-16 text-lg justify-start gap-4" variant="outline">
                <div className="bg-purple-100 p-2 rounded-full"><Disc className="h-6 w-6 text-purple-600" /></div>
                Import Catalog (CSV)
                <ArrowRight className="ml-auto h-5 w-5 text-gray-400" />
              </Button>
            </Link>

          </CardContent>
        </Card>

      </div>
    </div>
  )
}