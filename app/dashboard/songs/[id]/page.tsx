// app/dashboard/songs/[id]/page.tsx

import { db } from '@/lib/db'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
    SongMetadataForm,
    DeleteSongButton,
    ReleasesTable,
    WritersTable
} from './detail-client'

// HELPER: Formats raw DB string (T1234567890) to Human Readable
const formatISWC = (iswc: string | null | undefined) => {
  if (!iswc || iswc.length !== 11 || iswc[0] !== 'T') return iswc;
  return `${iswc[0]}-${iswc.slice(1, 4)}.${iswc.slice(4, 7)}.${iswc.slice(7, 10)}-${iswc[10]}`;
};

// --- SERVER COMPONENT ---

async function getSongDetails(id: string | undefined) {
  if (!id) return null; 
  
  return await db.song.findUnique({
    where: { id },
    include: {
      releases: true,
      writers: { include: { user: true } }
    }
  })
}

export default async function SongDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const song = await getSongDetails(id)

  if (!song) return (
    <div className="container mx-auto p-6 space-y-8">
        <h1 className="text-3xl font-bold text-red-600">Error: Song Not Found</h1>
        <p>Please check the link or ensure the song exists in your list.</p>
        <Link href="/dashboard/songs">
            <Button variant="outline">Back to Song List</Button>
        </Link>
    </div>
  ); 

  // 1. Format Data for Display
  const displayISWC = formatISWC(song.iswc);

  // 2. Format Writers for Client (Decimal -> Number)
const writersForClient = song.writers.map(writer => ({
  ...writer,
  percentage: writer.percentage.toNumber(),
  email: writer.email, // Pass the raw email field
}));

  // 3. FIX: Create a "Clean" object for the Metadata Form
  // We explicitly pick only the fields needed, ensuring 'writers' (with decimals) are NOT passed.
  const songMetadata = {
    id: song.id,
    title: song.title,
    iswc: song.iswc
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* HEADER */}
      <div className="flex justify-between items-start border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold">{song.title}</h1>
          <p className="text-gray-500 mt-1">ISWC: {displayISWC || 'Not Registered'}</p>
        </div>
        <DeleteSongButton songId={song.id} songTitle={song.title} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* COLUMN 1: METADATA EDIT FORM */}
        <div className="md:col-span-1">
          {/* FIX: Pass the clean 'songMetadata' object instead of the full 'song' */}
          <SongMetadataForm initialData={songMetadata} songId={song.id} />
        </div>

        {/* COLUMN 2: RELEASES LIST */}
        <div className="md:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Releases (Masters)</h2>
          <Card>
            <CardContent className="p-0">
              <ReleasesTable releases={song.releases} />
            </CardContent>
          </Card>
        </div>

        {/* COLUMN 3: WRITERS LIST */}
        <div className="md:col-span-3">
          <h2 className="text-xl font-semibold mb-4">Writers (Composition)</h2>
          
          {/* UPDATE: Pass songId here! */}
          <WritersTable writers={writersForClient} songId={song.id} />
          
        </div>
      </div>
    </div>
  )
}