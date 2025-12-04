// app/dashboard/songs/[id]/page.tsx

import { db } from '@/lib/db'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Disc, Music2, Plus, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Action Buttons
import { DownloadSplitSheetButton } from './pdf-button'
import { ExportCWRButton } from './export-button'
import SignContractButton from './sign-contract-button' 

// Client Components
import { 
    SongMetadataForm, 
    DeleteSongButton, 
    ReleasesTable, 
    WritersTable 
} from './detail-client'

import { ReleaseArtwork } from '@/components/artwork'

// HELPER: Formats raw DB string
const formatISWC = (iswc: string | null | undefined) => {
  if (!iswc || iswc.length !== 11 || iswc[0] !== 'T') return iswc;
  return `${iswc[0]}-${iswc.slice(1, 4)}.${iswc.slice(4, 7)}.${iswc.slice(7, 10)}-${iswc[10]}`;
};

// --- DATA FETCHING ---
async function getSongData(songId: string) {
  if (!songId) return null;

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  // Fetch Data
  const song = await db.song.findUnique({
    where: { id: songId },
    include: {
      writers: { 
        where: { songId: songId },
        include: { user: { select: { name: true, email: true } } } 
      },
      releases: {
        select: { id: true, title: true, isrc: true, coverArtUrl: true } 
      },
      splitSheets: {
        orderBy: { signedAt: 'desc' },
        take: 1
      }
    }
  })

  if (!song) return null
  return song
}

// --- MAIN PAGE COMPONENT ---
export default async function SongDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const song = await getSongData(id)

  if (!song) return (
    <div className="container mx-auto p-6 space-y-8">
        <h1 className="text-3xl font-bold text-red-600">Error: Song Not Found</h1>
        <Link href="/dashboard/songs">
            <Button variant="outline">Back to Song List</Button>
        </Link>
    </div>
  );

  // FIX: Convert ALL Decimal fields to numbers to satisfy Next.js
  const writersForClient = song.writers.map(writer => ({
    ...writer,
    percentage: writer.percentage.toNumber(),
    advance: writer.advance ? writer.advance.toNumber() : 0,     // <--- Added conversion
    collected: writer.collected ? writer.collected.toNumber() : 0, // <--- Added conversion
  }));

  const songMetadata = {
    id: song.id,
    title: song.title,
    iswc: song.iswc
  }

  const featuredCoverArtUrl = song.releases.find(r => r.coverArtUrl)?.coverArtUrl || null;
  const displayISWC = formatISWC(song.iswc);
  
  // Check if signed
  const hasSigned = song.splitSheets.length > 0;

  // Calculate total validity on server to disable actions
  const totalPercentage = writersForClient.reduce((sum, w) => sum + w.percentage, 0);
  const isTotalValid = Math.abs(totalPercentage - 100) < 0.001;

  return (
    <div className="container mx-auto p-6 space-y-6">
      
      {/* HEADER */}
      <div className="flex items-start justify-between border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold">{song.title}</h1>
          <p className="text-gray-500 flex items-center gap-2 mt-1">
            <Music2 className="h-4 w-4" /> 
            ISWC: {displayISWC || 'Not Registered'}
          </p>
        </div>
        {!hasSigned && <DeleteSongButton songId={song.id} songTitle={song.title} />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUMN 1: METADATA FORM */}
        <div className="lg:col-span-1">
          <SongMetadataForm initialData={songMetadata} songId={song.id} />
        </div>

        {/* COLUMN 2 & 3: MAIN CONTENT */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* 1. RELEASES (MASTERS) */}
          <section>
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h2 className="text-xl font-bold">Releases (Masters)</h2>
                    <p className="text-sm text-gray-500">Recordings linked to this composition.</p>
                </div>
                
                {featuredCoverArtUrl ? (
                  <div className="shadow-md rounded-md overflow-hidden border border-gray-200">
                    <ReleaseArtwork url={featuredCoverArtUrl} size="lg" /> 
                  </div>
                ) : (
                  <div className="h-16 w-16 bg-gray-50 border border-gray-200 rounded-md flex items-center justify-center">
                    <Disc className="h-8 w-8 text-gray-300" />
                  </div>
                )}
            </div>

            <Card>
                <CardContent className="p-0">
                <ReleasesTable releases={song.releases} />
                </CardContent>
            </Card>
            
            <Link href={`/dashboard/releases/new?songId=${song.id}`}>
                <Button variant="outline" className="w-full gap-2 mt-4">
                <Plus className="h-4 w-4" /> Create New Master Release
                </Button>
            </Link>
          </section>

          {/* 2. WRITERS (SPLITS) */}
          <section>
             <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
               <h2 className="text-xl font-bold">Writers (Composition)</h2>
               
               {/* TOOLBAR: Download, Export, Sign */}
               <div className={`flex gap-2 transition-opacity ${!isTotalValid ? 'opacity-50 pointer-events-none' : ''}`}>
                  <DownloadSplitSheetButton song={songMetadata} writers={writersForClient} />
                  <ExportCWRButton songId={song.id} />
                  
                  {hasSigned ? (
                    <Button disabled variant="secondary" className="gap-2 bg-green-100 text-green-800 border border-green-200 opacity-100">
                        <CheckCircle2 className="h-4 w-4" /> Signed
                    </Button>
                  ) : (
                    <SignContractButton songId={song.id} />
                  )}
               </div>
             </div>
             
             {!isTotalValid && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded flex items-center gap-2 border border-red-200">
                    <AlertTriangle className="h-4 w-4" />
                    Splits must equal exactly 100% to sign or export.
                </div>
             )}
             
             <WritersTable writers={writersForClient} songId={song.id} />
          </section>

        </div>
      </div>
    </div>
  )
}