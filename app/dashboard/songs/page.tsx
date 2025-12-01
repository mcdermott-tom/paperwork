// app/dashboard/songs/page.tsx
import Link from 'next/link'
import { db } from '@/lib/db'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

// NEW HELPER: Converts the clean T11-digit DB format back to the readable format
const formatISWC = (iswc: string | null | undefined) => {
    // Return null or unchanged if not the correct 11-char length
    if (!iswc || iswc.length !== 11 || iswc[0] !== 'T') return iswc;
    
    // Format: T-DDD.DDD.DDD-D
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

  // Find songs where I am listed as a writer
  return await db.song.findMany({
    where: {
      writers: {
        some: { userId: user.id }
      }
    },
    include: {
      _count: { select: { releases: true } } // Count how many releases exist
    },
    orderBy: { createdAt: 'desc' }
  })
}

export default async function SongsListPage() {
  const songs = await getMySongs()

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Songs</h1>
        <Link href="/dashboard/songs/new">
          <Button>+ New Song</Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>ISWC</TableHead> {/* This will show the formatted code */}
                <TableHead>Releases</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {songs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24 text-gray-500">
                    No songs found. Create your first one!
                  </TableCell>
                </TableRow>
              ) : (
                songs.map((song) => (
                  <TableRow key={song.id}>
                    <TableCell className="font-medium">{song.title}</TableCell>
                    {/* FIX: Apply the formatter here */}
                    <TableCell>{formatISWC(song.iswc) || '-'}</TableCell>
                    <TableCell>{song._count.releases}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/dashboard/songs/${song.id}`}>
                        <Button variant="outline" size="sm">Manage</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}