'use client'

import { useState } from 'react'
import { updateSongMetadata, deleteSong, addWriter, updateSplit, deleteSplit } from '../actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Trash2, Pencil, UserPlus } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'


export interface ClientRelease {
  id: string;
  title: string;
  isrc: string | null;
  coverArtUrl: string | null;
}

export interface ClientWriter {
  id: string;
  role: string;
  percentage: number; 
  email: string | null;
  user: {
    name: string | null;
    email: string;
  } | null;
}

const COLORS = ['#22d3ee', '#4f46e5', '#a855f7', '#ec4899', '#f97316', '#84cc16'];

const formatISWC = (iswc: string | null | undefined) => {
  if (!iswc || iswc.length !== 11 || iswc[0] !== 'T') return iswc;
  return `${iswc[0]}-${iswc.slice(1, 4)}.${iswc.slice(4, 7)}.${iswc.slice(7, 10)}-${iswc[10]}`;
};

function CompositionPieChart({ writers }: { writers: ClientWriter[] }) {
    const chartData = writers.map(w => ({
        name: w.user ? (w.user.name || w.user.email) : w.email,
        value: w.percentage,
    }));

    return (
        <ResponsiveContainer width="100%" height={250}>
            <PieChart>
                <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                >
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip formatter={(value: any, name: any, props: any) => [`${value}%`, props.payload.name]} />
            </PieChart>
        </ResponsiveContainer>
    );
}

// --- 1. METADATA FORM ---
export function SongMetadataForm({ initialData, songId }: { initialData: any, songId: string }) {
    const [status, setStatus] = useState({ message: '', error: false })

    const handleSubmit = async (formData: FormData) => {
        formData.append('id', songId);
        const result = await updateSongMetadata(formData)
        if (result?.error) {
            setStatus({ message: `Error: ${result.error}`, error: true })
        } else {
            setStatus({ message: 'Saved successfully!', error: false })
        }
    }

    return (
        <Card>
            <CardHeader><CardTitle>Edit Metadata</CardTitle></CardHeader>
            <CardContent>
                <form action={handleSubmit} className="space-y-4">
                    <input type="hidden" name="id" value={songId} />
                    <div className="space-y-2">
                        <Label>Title</Label>
                        <Input name="title" defaultValue={initialData?.title} required />
                    </div>
                    <div className="space-y-2">
                        <Label>ISWC</Label>
                        <Input 
                            name="iswc" 
                            defaultValue={formatISWC(initialData?.iswc) || ''} 
                            placeholder="T-123.456.789-0" 
                        />
                    </div>
                    <Button type="submit" className="w-full">Save Changes</Button>
                    {status.message && (
                        <p className={`text-xs ${status.error ? 'text-red-500' : 'text-green-600'}`}>
                            {status.message}
                        </p>
                    )}
                </form>
            </CardContent>
        </Card>
    )
}

// --- 2. DELETE BUTTON ---
export function DeleteSongButton({ songId, songTitle }: { songId: string, songTitle: string }) {
    const handleDelete = async () => {
        if (confirm(`Delete "${songTitle}"?`)) await deleteSong(songId)
    }
    return (
        <Button onClick={handleDelete} variant="destructive" size="sm" className="gap-2">
            <Trash2 className="h-4 w-4" /> Delete
        </Button>
    )
}

// --- 3. RELEASES TABLE ---
export function ReleasesTable({ releases }: { releases: ClientRelease[] }) {
    return (
        <Table>
            <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>ISRC</TableHead></TableRow></TableHeader>
            <TableBody>
                {releases.length === 0 ? (
                    <TableRow><TableCell colSpan={2} className="text-center text-gray-500">No releases found.</TableCell></TableRow>
                ) : (
                    releases.map(r => (
                        <TableRow key={r.id}>
                            <TableCell>{r.title}</TableCell>
                            <TableCell className="font-mono text-xs">{r.isrc || '-'}</TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    )
}

// --- 4. WRITERS TABLE ---
interface WritersTableProps {
  writers: ClientWriter[];
  songId: string;
  hasSplits?: boolean; // NEW PROP
}

export function WritersTable({ writers, songId, hasSplits = true }: WritersTableProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWriter, setEditingWriter] = useState<ClientWriter | null>(null);

  const totalPercentage = writers.reduce((sum, w) => sum + w.percentage, 0);
  const isValidTotal = Math.abs(totalPercentage - 100) < 0.001;

  // If hasSplits wasn't passed, try to infer it from the percentage
  const showChart = hasSplits && totalPercentage > 0;

  const handleDelete = async (splitId: string) => {
    if (confirm("Remove this writer?")) await deleteSplit(splitId, songId);
  }

  const openAdd = () => { setEditingWriter(null); setIsDialogOpen(true); }
  const openEdit = (w: ClientWriter) => { setEditingWriter(w); setIsDialogOpen(true); }

  return (
    <div>
      
      {/* 1. TABLE (Splits) - ON TOP */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium text-sm text-gray-500">Split Sheet</h3>
        <Button size="sm" onClick={openAdd} className="gap-2"><UserPlus className="h-4 w-4"/> Add Writer</Button>
      </div>

      <Card className="mb-8">
      <Table>
        <TableHeader>
          <TableRow><TableHead>Writer</TableHead><TableHead>Role</TableHead><TableHead className="text-right">Split %</TableHead><TableHead></TableHead></TableRow>
        </TableHeader>
        <TableBody>
          {writers.length === 0 ? (
             <TableRow><TableCell colSpan={4} className="text-center text-gray-500 h-24">No writers added.</TableCell></TableRow>
          ) : (
            writers.map(w => (
              <TableRow key={w.id}>
                <TableCell>
                  {w.user ? (
                    <div><div className="font-medium">{w.user.name || 'User'}</div><div className="text-xs text-gray-500">{w.user.email}</div></div>
                  ) : (
                    <div>
                      <div className="font-medium text-gray-500 italic">{w.email}</div>
                      <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">Pending</span>
                    </div>
                  )}
                </TableCell>
                <TableCell>{w.role}</TableCell>
                <TableCell className="text-right font-mono font-bold">
                    {Number(w.percentage).toFixed(2)}%
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(w)}><Pencil className="h-3 w-3 text-gray-500"/></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(w.id)}><Trash2 className="h-3 w-3 text-red-500"/></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={2}>Total</TableCell>
            <TableCell className={`text-right font-bold ${isValidTotal ? 'text-green-600' : 'text-red-600'}`}>
              {totalPercentage.toFixed(2)}%
            </TableCell>
            <TableCell />
          </TableRow>
        </TableFooter>
      </Table>
      </Card>

      {/* 2. CHART (Ownership Breakdown) - CONDITIONALLY RENDERED */}
      {showChart && writers.length > 0 && (
        <Card>
            <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-sm">Ownership Visualization</h3>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${isValidTotal ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        Total: {totalPercentage.toFixed(2)}%
                    </span>
                </div>
                <CompositionPieChart writers={writers} />
            </CardContent>
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingWriter ? 'Edit Split' : 'Add Collaborator'}</DialogTitle></DialogHeader>
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
          <p className="text-xs text-gray-500">User must be signed up to accept.</p>
        </div>
      )}
      <div className="space-y-2">
        <Label>Role</Label>
        <select name="role" defaultValue={initialData?.role || "Lyricist"} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
          <option value="Lyricist">Lyricist</option>
          <option value="Composer">Composer</option>
          <option value="Both">Both</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label>Percentage (%)</Label>
        <Input name="percentage" type="number" step="0.01" min="0" max="100" defaultValue={initialData?.percentage || 0} required />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button type="submit" className="w-full">{initialData ? 'Update Split' : 'Add Writer'}</Button>
    </form>
  )
}