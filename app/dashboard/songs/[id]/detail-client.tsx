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

import type { Release } from '@prisma/client'

// FIX: Define a Client-Safe type (replacing Decimal with number)
interface ClientWriter {
  id: string;
  role: string;
  percentage: number; // Client expects a simple number
  user: {
    name: string | null;
    email: string;
  } | null;
}

// HELPER: Formats raw DB string (T1234567890) to Human Readable (T-123.456.789-0)
// This is needed here so the Input field default value looks correct.
const formatISWC = (iswc: string | null | undefined) => {
  if (!iswc || iswc.length !== 11 || iswc[0] !== 'T') return iswc;
  return `${iswc[0]}-${iswc.slice(1, 4)}.${iswc.slice(4, 7)}.${iswc.slice(7, 10)}-${iswc[10]}`;
};

// --- 1. Song Metadata Form ---
export function SongMetadataForm({ initialData, songId }: { initialData: any, songId: string }) {
  const [status, setStatus] = useState({ message: '', error: false })

  const handleSubmit = async (formData: FormData) => {
    formData.append('id', songId);

    const result = await updateSongMetadata(formData)
    if (result?.error) {
      setStatus({ message: `Error: ${result.error}`, error: true })
    } else {
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
            {/* FIX: Apply formatISWC here */}
            <Input 
              name="iswc" 
              defaultValue={formatISWC(initialData?.iswc) || ''} 
              placeholder="T-123.456.789-0" 
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
export function DeleteSongButton({ songId, songTitle }: { songId: string, songTitle: string }) {
  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete the song "${songTitle}" and all its associated data? This cannot be undone.`)) {
      const result = await deleteSong(songId)
      if (result?.error) {
        alert(`Deletion failed: ${result.error}`)
      }
    }
  }
  return (
    <Button onClick={handleDelete} variant="destructive" className="flex items-center gap-2">
      <Trash2 className="h-4 w-4" /> Delete Song
    </Button>
  )
}

// --- 3. Table Components ---

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

export function WritersTable({ writers }: { writers: ClientWriter[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow><TableHead>Writer</TableHead><TableHead className="text-right">Split</TableHead></TableRow>
      </TableHeader>
      <TableBody>
        {writers.length === 0 ? (
           <TableRow><TableCell colSpan={2} className="text-center text-gray-500">No writers found.</TableCell></TableRow>
        ) : (
          writers.map(w => (
            <TableRow key={w.id}>
              <TableCell>
                <div className="font-medium">{w.user?.name || w.user?.email}</div>
                <div className="text-xs text-gray-500">{w.role}</div>
              </TableCell>
              <TableCell className="text-right font-bold">{w.percentage}%</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}