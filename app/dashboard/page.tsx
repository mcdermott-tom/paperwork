import { db } from '@/lib/db'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { ReleaseArtwork } from '@/components/artwork' 
import { SearchSong } from './songs/new/search-song' 
import { UnregisteredSongsWidget } from './unregistered-songs-widget' // Import new widget

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
  })

  // 2. Fetch Recent Releases (Masters)
  const recentReleases = await db.release.findMany({
    where: { song: { writers: { some: { userId: user.id } } } },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { song: { select: { title: true } } }
  })

  // 3. NEW: Fetch "Action Items" (Songs missing ISWC or Signed Split)
  // We fetch songs connected to the user where critical fields are null
  const incompleteSongsRaw = await db.song.findMany({
    where: { 
        writers: { some: { userId: user.id } },
        OR: [
            { iswc: null },
            // You can add logic here for missing split sheets if you track that on the Song level
            // e.g. splitSheets: { none: {} } 
        ]
    },
    take: 10,
    select: { id: true, title: true, iswc: true }
  })

  // Transform for the widget
  const actionItems = incompleteSongsRaw.map(song => {
      const missing = [];
      if (!song.iswc) missing.push("Missing ISWC");
      // if (!song.hasSplitSheet) missing.push("Sign Split Sheet");
      
      return {
          id: song.id,
          title: song.title,
          artist: "Unknown", // You could fetch this from the first release if needed
          missingItems: missing
      }
  })

  return { recentSongs, recentReleases, actionItems }
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
        
        {/* QUADRANT 1 (TL): SPOTIFY SEARCH */}
        <Card className="col-span-1 min-h-[350px] border-blue-100 shadow-sm">
          <CardHeader>
            <CardTitle>Add to Discography</CardTitle>
            <CardDescription>Search Spotify to instantly claim your songs.</CardDescription>
          </CardHeader>
          <CardContent>
             <SearchSong />
          </CardContent>
        </Card>

        {/* QUADRANT 2 (TR): RECENT SONGS */}
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

        {/* QUADRANT 3 (BL): RECENT RELEASES */}
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
                          <ReleaseArtwork url={release.coverArtUrl} size="md" />
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

        {/* QUADRANT 4 (BR): ACTION ITEMS (The "Fix It" Box) */}
        <UnregisteredSongsWidget songs={data.actionItems} />

      </div>
    </div>
  )
}