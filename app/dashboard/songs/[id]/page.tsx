// app/dashboard/songs/[id]/page.tsx

import { db } from '@/lib/db'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

// IMPORT CLIENT COMPONENTS from the separate file
import {
    SongMetadataForm,
    DeleteSongButton,
    ReleasesTable,
    WritersTable
} from './detail-client'

// --- 1. SERVER COMPONENT (Data Fetch) ---

async function getSongDetails(id: string | undefined) {
  // FIX: Return early if the ID is missing (Prisma requires a defined ID)
  if (!id) {
    return null; 
  }
  
  return await db.song.findUnique({
    where: { id },
    include: {
      releases: true,
      writers: { include: { user: true } }
    }
  })
}

export default async function SongDetailPage({ params }: { params: { id: string } }) {
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

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-start border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold">{song.title}</h1>
          <p className="text-gray-500 mt-1">ISWC: {song.iswc || 'Not Registered'}</p>
        </div>
        <DeleteSongButton songId={song.id} songTitle={song.title} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* COLUMN 1: METADATA EDIT FORM (Client Component) */}
        <div className="md:col-span-1">
          {/* CRITICAL: Pass song.id to the client form for the server action */}
          <SongMetadataForm initialData={song} songId={song.id} />
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

        {/* COLUMN 3: WRITERS LIST (Composition Splits) - Takes full width for now */}
        <div className="md:col-span-3">
          <h2 className="text-xl font-semibold mb-4">Writers (Composition)</h2>
          <WritersTable writers={song.writers} />
        </div>
      </div>
    </div>
  )
}

// NOTE: All client component function bodies were moved to detail-client.tsx