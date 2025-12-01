// app/dashboard/releases/page.tsx

import { db } from '@/lib/db'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Music2 } from 'lucide-react'
import { ReleaseArtwork } from '@/components/artwork' // Ensure this component is imported

// HELPER: Get all releases for the user
async function getMyReleases() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  return await db.release.findMany({
    where: {
      song: {
        writers: { some: { userId: user.id } }
      }
    },
    include: {
      song: { select: { title: true, id: true } }
    },
    orderBy: { createdAt: 'desc' }
  })
}

// HELPER: Format ISRC
const formatISRC = (isrc: string | null) => {
  if (!isrc || isrc.length !== 12) return isrc;
  return `${isrc.slice(0, 2)}-${isrc.slice(2, 5)}-${isrc.slice(5, 7)}-${isrc.slice(7)}`;
};

export default async function ReleasesListPage() {
  const releases = await getMyReleases()

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Master Recordings</h1>
          <p className="text-gray-500">Manage your ISRCs and audio assets.</p>
        </div>
        <Link href="/dashboard/releases/new">
          <Button className="gap-2"><Plus className="h-4 w-4"/> New Release</Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[350px]">Release Title</TableHead>
                <TableHead>Parent Song</TableHead>
                <TableHead>ISRC</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {releases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24 text-gray-500">
                    No releases found.
                  </TableCell>
                </TableRow>
              ) : (
                releases.map((release) => (
                  <TableRow key={release.id}>
                    <TableCell>
                      <div className="flex items-center gap-4">
                        <ReleaseArtwork url={release.coverArtUrl} size="md" />
                        <div>
                          <div className="font-medium">{release.title}</div>
                          <div className="text-xs text-gray-500">{release.song.title}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link href={`/dashboard/songs/${release.song.id}`} className="hover:underline flex items-center gap-2 text-blue-600">
                        <Music2 className="h-3 w-3" />
                        {release.song.title}
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{formatISRC(release.isrc) || '-'}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/dashboard/releases/${release.id}`}>
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