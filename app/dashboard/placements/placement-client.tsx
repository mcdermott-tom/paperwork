'use client'

import { useState } from 'react'
import { createPlacement, deletePlacement, updatePlacementField } from './actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, CheckCircle, Clock, AlertCircle } from 'lucide-react'

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

export function PlacementBoard({ placements, songs }: { placements: any[], songs: any[] }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Totals Logic
  const totalValue = placements.reduce((sum, p) => sum + Number(p.fee), 0)
  const totalUnpaid = placements.filter(p => p.feeStatus !== 'paid').reduce((sum, p) => sum + Number(p.fee), 0)

  return (
    <div className="space-y-6">
      
      {/* SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Total Booked Revenue</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatCurrency(totalValue)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Unpaid Invoices</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-orange-600">{formatCurrency(totalUnpaid)}</div></CardContent>
        </Card>
        <Card className="flex items-center justify-center bg-gray-50 border-dashed">
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Log New Deal
          </Button>
        </Card>
      </div>

      {/* TABLE */}
      <Card>
        <CardHeader><CardTitle>Placement Tracker</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Song / Client</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Upfront Fee</TableHead>
                <TableHead>Fee Status</TableHead>
                <TableHead>PRO (BMI/ASCAP)</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {placements.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center h-24 text-gray-500">No placements yet.</TableCell></TableRow>
              ) : (
                placements.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="font-medium">{p.song.title}</div>
                      <div className="text-xs text-gray-500">{p.client} — {p.project}</div>
                    </TableCell>
                    <TableCell><Badge variant="outline">{p.licenseType}</Badge></TableCell>
                    <TableCell className="font-mono">{formatCurrency(p.fee)}</TableCell>
                    
                    {/* STATUS 1: MONEY */}
                    <TableCell>
                        <FeeStatusBadge id={p.id} status={p.feeStatus} />
                    </TableCell>
                    
                    {/* STATUS 2: REGISTRATION */}
                    <TableCell>
                        <ProStatusBadge id={p.id} status={p.proStatus} />
                    </TableCell>
                    
                    <TableCell className="text-right">
                        <DeletePlacementButton id={p.id} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Log New Placement</DialogTitle></DialogHeader>
          <PlacementForm songs={songs} onSuccess={() => setIsDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

// --- SUB COMPONENTS ---

function FeeStatusBadge({ id, status }: { id: string, status: string }) {
    const toggle = async () => {
        // Cycle: pending -> invoiced -> paid
        const next = status === 'pending' ? 'invoiced' : status === 'invoiced' ? 'paid' : 'pending';
        await updatePlacementField(id, 'feeStatus', next);
    }
    
    const colors = {
        pending: "bg-red-100 text-red-800 hover:bg-red-200",
        invoiced: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
        paid: "bg-green-100 text-green-800 hover:bg-green-200",
    }

    return (
        <Badge className={`cursor-pointer ${colors[status as keyof typeof colors]}`} onClick={toggle}>
            {status === 'paid' && <CheckCircle className="w-3 h-3 mr-1" />}
            {status.toUpperCase()}
        </Badge>
    )
}

function ProStatusBadge({ id, status }: { id: string, status: string }) {
    const toggle = async () => {
        // Cycle: todo -> submitted -> confirmed
        const next = status === 'todo' ? 'submitted' : status === 'submitted' ? 'confirmed' : 'todo';
        await updatePlacementField(id, 'proStatus', next);
    }
    
    const colors = {
        todo: "bg-gray-100 text-gray-600 hover:bg-gray-200",
        submitted: "bg-blue-100 text-blue-800 hover:bg-blue-200",
        confirmed: "bg-purple-100 text-purple-800 hover:bg-purple-200",
    }

    return (
        <Badge className={`cursor-pointer ${colors[status as keyof typeof colors]}`} onClick={toggle}>
            {status === 'confirmed' ? "BMI/ASCAP OK" : status === 'submitted' ? "SENT" : "UNREGISTERED"}
        </Badge>
    )
}

function DeletePlacementButton({ id }: { id: string }) {
    const handleDelete = async () => {
        if(confirm("Delete this record?")) await deletePlacement(id);
    }
    return (
        <Button variant="ghost" size="icon" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
        </Button>
    )
}

function PlacementForm({ songs, onSuccess }: { songs: any[], onSuccess: () => void }) {
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (formData: FormData) => {
        setLoading(true);
        const result = await createPlacement(formData);
        setLoading(false);

        if (result?.error) {
            alert(result.error);
        } else {
            onSuccess();
        }
    }

    return (
        <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label>Song</Label>
                <select name="songId" defaultValue="" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required>
                    <option value="" disabled>Select a song...</option>
                    {songs.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Client</Label><Input name="client" placeholder="e.g. Netflix" required /></div>
                <div className="space-y-2"><Label>Project</Label><Input name="project" placeholder="e.g. Stranger Things" /></div>
            </div>
            
            <div className="space-y-2"><Label>Fee ($)</Label><Input name="fee" type="number" step="0.01" placeholder="0.00" required /></div>

            {/* Hidden defaults to simplify form */}
            <input type="hidden" name="licenseType" value="Sync" />
            <input type="hidden" name="feeStatus" value="pending" />
            <input type="hidden" name="proStatus" value="todo" />
            
            <div className="space-y-2"><Label>Notes</Label><Input name="notes" placeholder="Deal terms or details..." /></div>
            
            <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Saving..." : "Log Placement"}
            </Button>
        </form>
    )
}