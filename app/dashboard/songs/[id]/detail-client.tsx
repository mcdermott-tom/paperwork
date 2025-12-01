// app/dashboard/songs/[id]/detail-client.tsx
'use client'

import { useState } from 'react'
import { updateSongMetadata, deleteSong, addWriter, updateSplit, deleteSplit } from '../actions' // Added new actions
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Trash2, Pencil, Plus, UserPlus } from 'lucide-react'

import type { Release } from '@prisma/client'

// Client-safe type for Writers
interface ClientWriter {
  id: string;
  role: string;
  percentage: number;
  email: string | null; // Add this
  user: {
    name: string | null;
    email: string;
  } | null;
}

// HELPER: Format ISWC
const formatISWC = (iswc: string | null | undefined) => {
  if (!iswc || iswc.length !== 11 || iswc[0] !== 'T') return iswc;
  return `${iswc[0]}-${iswc.slice(1, 4)}.${iswc.slice(4, 7)}.${iswc.slice(7, 10)}-${iswc[10]}`;
};

// --- 1. Song Metadata Form (Existing) ---
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
            <Label>Title</Label>
            <Input name="title" defaultValue={initialData?.title} required />
          </div>
          <div className="space-y-2">
            <Label>ISWC</Label>
            <Input name="iswc" defaultValue={formatISWC(initialData?.iswc) || ''} placeholder="T-123.456.789-0" />
          </div>
          <Button type="submit" className="w-full">Save Changes</Button>
          {status.message && <p className={`text-sm ${status.error ? 'text-red-500' : 'text-green-500'}`}>{status.message}</p>}
        </form>
      </CardContent>
    </Card>
  )
}

// --- 2. Delete Song Button (Existing) ---
export function DeleteSongButton({ songId, songTitle }: { songId: string, songTitle: string }) {
  const handleDelete = async () => {
    if (confirm(`Delete "${songTitle}"?`)) await deleteSong(songId)
  }
  return (
    <Button onClick={handleDelete} variant="destructive" className="flex items-center gap-2">
      <Trash2 className="h-4 w-4" /> Delete Song
    </Button>
  )
}

// --- 3. Releases Table (Existing) ---
export function ReleasesTable({ releases }: { releases: Release[] }) {
  return (
    <Table>
      <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>ISRC</TableHead></TableRow></TableHeader>
      <TableBody>
        {releases.length === 0 ? (
          <TableRow><TableCell colSpan={2} className="text-center text-gray-500">No releases found.</TableCell></TableRow>
        ) : (
          releases.map(r => (
            <TableRow key={r.id}><TableCell>{r.title}</TableCell><TableCell className="font-mono text-xs">{r.isrc || '-'}</TableCell></TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}

// --- 4. Writers Table (The New Split Sheet) ---

export function WritersTable({ writers, songId }: { writers: ClientWriter[], songId: string }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWriter, setEditingWriter] = useState<ClientWriter | null>(null);

  // Calculate Total Percentage
  const totalPercentage = writers.reduce((sum, w) => sum + w.percentage, 0);
  const isValidTotal = Math.abs(totalPercentage - 100) < 0.1;

  const handleDelete = async (splitId: string) => {
    if (confirm("Remove this writer?")) await deleteSplit(splitId, songId);
  }

  const openAdd = () => { setEditingWriter(null); setIsDialogOpen(true); }
  const openEdit = (w: ClientWriter) => { setEditingWriter(w); setIsDialogOpen(true); }

  return (
    <div>
      <div className="p-4 border-b flex justify-between items-center bg-gray-50">
        <div>
          <h3 className="font-medium">Splits & Ownership</h3>
          {!isValidTotal && <span className="text-xs text-red-600 font-bold">Total must equal 100%</span>}
        </div>
        <Button size="sm" onClick={openAdd} className="gap-2"><UserPlus className="h-4 w-4"/> Add Writer</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Writer</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="text-right">Split %</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {writers.length === 0 ? (
             <TableRow>
               <TableCell colSpan={4} className="text-center text-gray-500">No writers yet.</TableCell>
             </TableRow>
          ) : (
            writers.map(w => (
              <TableRow key={w.id}>
                <TableCell>
                  {w.user ? (
                    <div>
                      <div className="font-medium">{w.user.name || 'User'}</div>
                      <div className="text-xs text-gray-500">{w.user.email}</div>
                    </div>
                  ) : (
                    <div>
                      <div className="font-medium text-gray-500 italic">{w.email}</div>
                      <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                        Pending Signup
                      </span>
                    </div>
                  )}
                </TableCell>
                <TableCell>{w.role}</TableCell>
                <TableCell className="text-right font-mono font-bold">{w.percentage}%</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(w)}>
                    <Pencil className="h-3 w-3 text-gray-500"/>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(w.id)}>
                    <Trash2 className="h-3 w-3 text-red-500"/>
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={2}>Total</TableCell>
            <TableCell className={`text-right font-bold ${isValidTotal ? 'text-green-600' : 'text-red-600'}`}>
              {totalPercentage}%
            </TableCell>
            <TableCell />
          </TableRow>
        </TableFooter>
      </Table>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingWriter ? 'Edit Split' : 'Add Collaborator'}</DialogTitle>
          </DialogHeader>
          <WriterForm 
            songId={songId} 
            initialData={editingWriter} 
            onSuccess={() => setIsDialogOpen(false)} 
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function WriterForm({ songId, initialData, onSuccess }: { songId: string, initialData: ClientWriter | null, onSuccess: () => void }) {
  const [error, setError] = useState("");

  const handleSubmit = async (formData: FormData) => {
    setError("");
    formData.append('songId', songId);
    
    let result;
    if (initialData) {
      formData.append('splitId', initialData.id);
      result = await updateSplit(formData);
    } else {
      result = await addWriter(formData);
    }

    if (result?.error) {
      setError(result.error);
    } else {
      onSuccess();
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      
      {!initialData && (
        <div className="space-y-2">
          <Label>Writer Email</Label>
          <Input name="email" type="email" placeholder="collaborator@example.com" required />
          <p className="text-xs text-gray-500">User must already be signed up on Paperwork.</p>
        </div>
      )}

      <div className="space-y-2">
        <Label>Role</Label>
        <select name="role" defaultValue={initialData?.role || "Lyricist"} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
          <option value="Lyricist">Lyricist</option>
          <option value="Composer">Composer</option>
          <option value="Both">Both (Lyricist & Composer)</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label>Ownership Percentage (%)</Label>
        <Input 
          name="percentage" 
          type="number" 
          step="0.01" 
          min="0" 
          max="100" 
          defaultValue={initialData?.percentage || 0} 
          required 
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button type="submit" className="w-full">
        {initialData ? 'Update Split' : 'Add Writer'}
      </Button>
    </form>
  )
}