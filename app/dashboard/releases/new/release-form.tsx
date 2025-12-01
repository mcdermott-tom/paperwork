'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createRelease } from '../../songs/actions' // Import from songs directory
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function ReleaseForm({ songs }: { songs: { id: string; title: string }[] }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    const result = await createRelease(formData)
    setLoading(false)

    if (result?.error) {
      alert(`Error: ${result.error}`)
    } else if (result?.success) {
      // On success, redirect to the Releases list (or the Song page)
      // Since createRelease revalidates the song page, we can choose where to go.
      // Let's go to the Releases list view.
      router.push('/dashboard/releases')
      router.refresh()
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Parent Song</Label>
        {/* Native Select is robust and easy for forms */}
        <select 
          name="songId" 
          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          required
          defaultValue=""
        >
          <option value="" disabled>Select a song...</option>
          {songs.map(song => (
            <option key={song.id} value={song.id}>{song.title}</option>
          ))}
        </select>
        <p className="text-xs text-gray-500">Every release must belong to a composition.</p>
      </div>

      <div className="space-y-2">
        <Label>Release Title</Label>
        <Input name="title" placeholder="e.g. Radio Edit" required />
      </div>

      <div className="space-y-2">
        <Label>ISRC (Optional)</Label>
        <Input name="isrc" placeholder="US-XXX-24-12345" />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Creating...' : 'Create Release'}
      </Button>
    </form>
  )
}