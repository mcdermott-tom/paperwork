'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateRelease, deleteRelease } from '../../songs/actions' // Importing from the centralized actions file
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trash2 } from 'lucide-react'

// HELPER: Format ISRC for display (US-XXX-24-12345)
const formatISRC = (isrc: string | null | undefined) => {
  if (!isrc || isrc.length !== 12) return isrc;
  return `${isrc.slice(0, 2)}-${isrc.slice(2, 5)}-${isrc.slice(5, 7)}-${isrc.slice(7)}`;
};

// --- 1. Metadata Form ---
export function ReleaseMetadataForm({ initialData, songId }: { initialData: any, songId: string }) {
  const [status, setStatus] = useState({ message: '', error: false })

  const handleSubmit = async (formData: FormData) => {
    // We need to pass the ID and SongID (for revalidation) to the action
    formData.append('id', initialData.id);
    formData.append('songId', songId);

    const result = await updateRelease(formData)
    
    if (result?.error) {
      setStatus({ message: `Error: ${result.error}`, error: true })
    } else {
      setStatus({ message: 'Release updated successfully!', error: false })
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle>Edit Release Metadata</CardTitle></CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input name="title" defaultValue={initialData?.title} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="isrc">ISRC</Label>
            <Input 
              name="isrc" 
              defaultValue={formatISRC(initialData?.isrc) || ''} 
              placeholder="US-XXX-24-12345" 
            />
          </div>

          <Button type="submit" className="w-full">Save Changes</Button>
          
          {status.message && (
            <p className={`text-sm ${status.error ? 'text-red-500' : 'text-green-500'}`}>
              {status.message}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  )
}

// --- 2. Delete Button ---
export function DeleteReleaseButton({ releaseId, songId, releaseTitle }: { releaseId: string, songId: string, releaseTitle: string }) {
  const router = useRouter()

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete the release "${releaseTitle}"? This cannot be undone.`)) {
      const result = await deleteRelease(releaseId, songId)
      
      if (result?.error) {
        alert(`Deletion failed: ${result.error}`)
      } else {
        // Redirect back to the releases list after successful deletion
        router.push('/dashboard/releases')
        router.refresh()
      }
    }
  }

  return (
    <Button onClick={handleDelete} variant="destructive" className="flex items-center gap-2">
      <Trash2 className="h-4 w-4" /> Delete Release
    </Button>
  )
}