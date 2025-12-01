import { db } from '@/lib/db'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Music2 } from 'lucide-react'
import { ReleaseMetadataForm, DeleteReleaseButton } from './detail-client'

// HELPER: Format ISRC for server-side display
const formatISRC = (isrc: string | null | undefined) => {
  if (!isrc || isrc.length !== 12) return isrc;
  return `${isrc.slice(0, 2)}-${isrc.slice(2, 5)}-${isrc.slice(5, 7)}-${isrc.slice(7)}`;
};

async function getReleaseDetails(id: string | undefined) {
  if (!id) return null;
  
  return await db.release.findUnique({
    where: { id },
    include: {
      song: true, // Include parent song info
      // Future: include masterOwners (splits) here
    }
  })
}

export default async function ReleaseDetailPage({ params }: { params: { id: string } }) {
  const { id } = await params
  const release = await getReleaseDetails(id)

  if (!release) return <div>Release not found.</div>

  const displayISRC = formatISRC(release.isrc);

  return (
    <div className="container mx-auto p-6 space-y-8">
      
      {/* HEADER */}
      <div className="flex justify-between items-start border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold">{release.title}</h1>
          <p className="text-gray-500 mt-1 font-mono">ISRC: {displayISRC || 'Not Assigned'}</p>
          
          {/* Link back to Parent Song */}
          <Link 
            href={`/dashboard/songs/${release.songId}`} 
            className="flex items-center gap-2 mt-2 text-blue-600 hover:underline text-sm"
          >
            <Music2 className="h-4 w-4" />
            Parent Song: {release.song.title}
          </Link>
        </div>
        
        <DeleteReleaseButton 
          releaseId={release.id} 
          songId={release.songId} 
          releaseTitle={release.title} 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* COLUMN 1: METADATA FORM */}
        <div className="md:col-span-1">
          <ReleaseMetadataForm initialData={release} songId={release.songId} />
        </div>

        {/* COLUMN 2: MASTER SPLITS (Placeholder for Phase 2) */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-gray-50 border border-dashed rounded-lg p-8 text-center text-gray-500">
            <h3 className="font-semibold mb-2">Master Splits</h3>
            <p className="text-sm">Master split functionality (Producers, Labels, Featured Artists) will be enabled in Phase 2.</p>
          </div>
        </div>

      </div>
    </div>
  )
}