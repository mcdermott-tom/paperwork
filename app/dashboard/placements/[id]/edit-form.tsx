'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updatePlacement, deletePlacement } from '../actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Trash2 } from 'lucide-react'

export function EditPlacementForm({ placement }: { placement: any }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    await updatePlacement(placement.id, formData)
    setLoading(false)
    router.refresh()
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this placement?')) return
    await deletePlacement(placement.id)
    router.push('/dashboard/placements')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deal Details</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Client</label>
              <input name="client" defaultValue={placement.client} className="flex h-10 w-full rounded-md border border-input px-3 py-2 text-sm bg-background" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Project</label>
              <input name="project" defaultValue={placement.project || ''} className="flex h-10 w-full rounded-md border border-input px-3 py-2 text-sm bg-background" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">License Type</label>
              <select name="licenseType" defaultValue={placement.licenseType} className="flex h-10 w-full rounded-md border border-input px-3 py-2 text-sm bg-background">
                <option value="Sync">Sync</option>
                <option value="Master Use">Master Use</option>
                <option value="Mechanical">Mechanical</option>
                <option value="Performance">Performance</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Fee Amount ($)</label>
              <input type="number" step="0.01" name="fee" defaultValue={placement.fee} className="flex h-10 w-full rounded-md border border-input px-3 py-2 text-sm bg-background" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <select name="feeStatus" defaultValue={placement.feeStatus} className="flex h-10 w-full rounded-md border border-input px-3 py-2 text-sm bg-background">
                <option value="pending">Pending</option>
                <option value="invoiced">Invoiced</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Notes</label>
            <textarea name="notes" defaultValue={placement.notes || ''} className="flex min-h-[80px] w-full rounded-md border border-input px-3 py-2 text-sm bg-background" />
          </div>

          <div className="flex justify-between items-center pt-4">
            <Button type="button" variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}