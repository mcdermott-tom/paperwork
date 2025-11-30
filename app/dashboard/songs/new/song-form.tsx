'use client'

import { createSong } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState } from 'react'

export function SongForm() {
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    const result = await createSong(formData)
    setLoading(false)
    
    // If the action returns an object with an error, show it
    if (result?.error) {
      alert(result.error)
    }
    // If successful, the server action triggers a redirect, so we don't need an 'else' here
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Song Title</Label>
        <Input name="title" placeholder="e.g. Yesterday" required />
      </div>
      <div className="space-y-2">
        <Label>ISWC (Optional)</Label>
        <Input name="iswc" placeholder="e.g. T-123.456.789-0" />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Creating...' : 'Create Song'}
      </Button>
    </form>
  )
}