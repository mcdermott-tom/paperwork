// app/dashboard/songs/[id]/detail-client.tsx
'use client'

import { useState } from 'react'
import { updateSongMetadata, deleteSong } from '../actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Trash2 } from 'lucide-react'
import Link from 'next/link'


// NOTE: You must have run `npm install @prisma/client` and `npx prisma generate` for these types to be available
import type { Release, WriterSplit, User } from '@prisma/client'

// Define the complex Writer type (WriterSplit includes the User model)
interface WriterWithUser extends WriterSplit {
  user: User | null;
}

// --- 1. Refactor the display into a form (Client Component) ---
// The songId is passed from the Server Component to ensure correct update path
export function SongMetadataForm({ initialData, songId }: { initialData: any, songId: string }) {
  const [status, setStatus] = useState({ message: '', error: false })

  const handleSubmit = async (formData: FormData) => {
    // Add the ID field back to the form data for the Server Action
    formData.append('id', songId);

    const result = await updateSongMetadata(formData)
    if (result?.error) {
      setStatus({ message: `Error: ${result.error}`, error: true })
    } else {
      // Force a soft refresh to update the Server Component's data display
      // Note: This relies on the actions.ts file to revalidatePath('/dashboard/songs/[id]')
      setStatus({ message: 'Metadata updated successfully!', error: false })
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle>Edit Song Metadata</CardTitle></CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="id" value={songId} />

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input name="title" defaultValue={initialData?.title} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="iswc">ISWC</Label>
            <Input name="iswc" defaultValue={initialData?.iswc || ''} placeholder="T-123.456.789-0" />
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

// --- 2. Delete Button (Client Component) ---
export function DeleteSongButton({ songId, songTitle }: { songId: string, songTitle: string }) {
  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete the song "${songTitle}" and all its associated data? This cannot be undone.`)) {
      const result = await deleteSong(songId)
      if (result?.error) {
        alert(`Deletion failed: ${result.error}`)
      }
      // Note: The actions.ts file handles the redirect on successful deletion.
    }
  }
  return (
    <Button onClick={handleDelete} variant="destructive" className="flex items-center gap-2">
      <Trash2 className="h-4 w-4" /> Delete Song
    </Button>
  )
}

// --- 3. Placeholder Table Components (Client or Server, but placed here for clarity) ---

// This remains un-client-marked for now, but uses the imported types
export function ReleasesTable({ releases }: { releases: Release[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow><TableHead>Title</TableHead><TableHead>ISRC</TableHead></TableRow>
      </TableHeader>
      <TableBody>
        {releases.map(r => (
          <TableRow key={r.id}>
            <TableCell>{r.title}</TableCell>
            <TableCell className="font-mono text-xs">{r.isrc || '-'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export function WritersTable({ writers }: { writers: WriterWithUser[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow><TableHead>Writer</TableHead><TableHead className="text-right">Split</TableHead></TableRow>
      </TableHeader>
      <TableBody>
        {writers.map(w => (
          <TableRow key={w.id}>
            <TableCell>
              <div className="font-medium">{w.user?.name || w.user?.email}</div>
              <div className="text-xs text-gray-500">{w.role}</div>
            </TableCell>
            <TableCell className="text-right font-bold">{Number(w.percentage)}%</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}