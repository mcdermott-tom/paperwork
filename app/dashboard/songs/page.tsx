import Link from 'next/link'
import { db } from '@/lib/db'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Music2, Disc } from 'lucide-react'

// HELPER: Formats raw DB string (T1234567890) to Human Readable (T-123.456.789-0)
const formatISWC = (iswc: string | null | undefined) => {
    if (!iswc || iswc.length !== 11 || iswc[0] !== 'T') return iswc;
    return `${iswc[0]}-${iswc.slice(1, 4)}.${iswc.slice(4, 7)}.${iswc.slice(7, 10)}-${iswc[10]}`;
};

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
    where: {
      writers: { some: { userId: user.id } }
    },
    include: {
      // Fetch the most recent release to get the Cover Art & ISRC
      releases: {
        take: 1,
        orderBy: { createdAt: 'desc' },
        select: {
            coverArtUrl: true,
            isrc: true,
            title: true
        }
      },
      _count: { select: { releases: true } }
    },
    orderBy: { createdAt: 'desc' }
  })
}

export default async function SongsListPage() {
  const songs = await getMySongs()

  return (
    <div className="container mx-auto p-6 space-y-6">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">My Songs</h1>
          <p className="text-gray-500">Manage your compositions and split sheets.</p>
        </div>
        <Link href="/dashboard/songs/new">
          <Button>+ New Song</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Catalog</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[400px]">Song Details</TableHead>
                <TableHead>Identifiers</TableHead>
                <TableHead>Releases</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {songs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-32 text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                        <Music2 className="h-8 w-8 text-gray-300" />
                        <p>No songs found. Create your first composition!</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                songs.map((song) => {
                    // Grab the representative release (if exists)
                    const latestRelease = song.releases[0];
                    const hasCover = !!latestRelease?.coverArtUrl;

                    return (
                        <TableRow key={song.id} className="group">
                            {/* COL 1: Image + Title */}
                            <TableCell>
                                <div className="flex items-center gap-4">
                                    {/* Cover Art or Fallback */}
                                    <div className="relative h-12 w-12 min-w-12 overflow-hidden rounded-md border bg-secondary flex items-center justify-center">
                                        {hasCover ? (
                                            <img 
                                                src={latestRelease.coverArtUrl!} 
                                                alt={song.title} 
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <Music2 className="h-6 w-6 text-gray-400" />
                                        )}
                                    </div>
                                    
                                    {/* Text Info */}
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-base">{song.title}</span>
                                        {/* Show importing source or subtitle if needed */}
                                        <span className="text-xs text-gray-500">
                                            {latestRelease ? `Released as "${latestRelease.title}"` : 'Unreleased'}
                                        </span>
                                    </div>
                                </div>
                            </TableCell>

                            {/* COL 2: ISRC / ISWC */}
                            <TableCell>
                                <div className="flex flex-col gap-1 text-sm">
                                    {/* Prioritize ISRC if available (User Request) */}
                                    {latestRelease?.isrc ? (
                                        <div className="flex items-center gap-2 text-gray-700 font-mono">
                                            <span className="text-xs text-gray-400 select-none">ISRC</span>
                                            {latestRelease.isrc}
                                        </div>
                                    ) : null}

                                    {/* Always show ISWC if available */}
                                    <div className="flex items-center gap-2 text-gray-600 font-mono">
                                        <span className="text-xs text-gray-400 select-none">ISWC</span>
                                        {song.iswc ? formatISWC(song.iswc) : <span className="text-gray-300">--</span>}
                                    </div>
                                </div>
                            </TableCell>

                            {/* COL 3: Release Count */}
                            <TableCell>
                                {song._count.releases > 0 ? (
                                    <Badge variant="secondary" className="flex w-fit items-center gap-1 font-normal">
                                        <Disc className="h-3 w-3" />
                                        {song._count.releases} {song._count.releases === 1 ? 'Release' : 'Releases'}
                                    </Badge>
                                ) : (
                                    <span className="text-xs text-gray-400">No releases</span>
                                )}
                            </TableCell>

                            {/* COL 4: Action */}
                            <TableCell className="text-right">
                                <Link href={`/dashboard/songs/${song.id}`}>
                                    <Button variant="outline" size="sm">Manage</Button>
                                </Link>
                            </TableCell>
                        </TableRow>
                    )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}