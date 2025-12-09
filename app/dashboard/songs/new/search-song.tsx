'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Plus, Music } from 'lucide-react'
import { claimSong } from '../actions' // Import the server action
import Image from 'next/image'

export function SearchSong() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [claimingId, setClaimingId] = useState<string | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setResults([])

    try {
      // Call your new API route
      const res = await fetch(`/api/spotify/search?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      if (data.songs) {
        setResults(data.songs)
      }
    } catch (error) {
      console.error("Search failed", error)
    } finally {
      setLoading(false)
    }
  }

  const handleClaim = async (songId: string) => {
    setClaimingId(songId)
    // Server Action
    await claimSong(songId)
    // Redirect happens on server, so we just wait
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input 
          placeholder="Search Spotify (e.g. 'Anti-Hero')" 
          value={query} 
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Search'}
        </Button>
      </form>

      {/* FIXED: Added max-height and overflow-y-auto to create scroll wheel */}
      <div className="space-y-3 max-h-[250px] overflow-y-auto pr-6">
        {results.map((song) => {
          // Get cover art from the first release, if available
          const coverArt = song.releases?.[0]?.coverArtUrl

          return (
            <Card key={song.id} className="overflow-hidden hover:bg-slate-50 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {coverArt ? (
                    <div className="relative h-12 w-12 rounded overflow-hidden bg-slate-200">
                         <Image src={coverArt} alt={song.title} fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="h-12 w-12 bg-slate-200 rounded flex items-center justify-center">
                        <Music className="h-6 w-6 text-slate-400" />
                    </div>
                  )}
                  
                  <div>
                    <h3 className="font-semibold">{song.title}</h3>
                    <p className="text-sm text-slate-500">
                      {song.releases?.[0]?.title || "Unknown Album"}
                    </p>
                  </div>
                </div>

                <Button 
                  size="sm" 
                  onClick={() => handleClaim(song.id)}
                  disabled={claimingId === song.id}
                >
                  {claimingId === song.id ? (
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Add to My Paperwork
                </Button>
              </CardContent>
            </Card>
          )
        })}
        
        {results.length === 0 && !loading && query && (
            <div className="text-center text-slate-500 py-8">
                No songs found. Try a different search.
            </div>
        )}
      </div>
    </div>
  )
}