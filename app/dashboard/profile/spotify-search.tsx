'use client'

import { useState } from 'react'
import { searchSpotifyArtists, claimArtist, importSpotifyCatalog, resetSpotifyConnection } from './spotify-actions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, CheckCircle, RefreshCw, XCircle } from 'lucide-react'
import { toast } from 'sonner' 

// eslint-disable-next-line @next/next/no-img-element
export function SpotifyConnect({ currentArtistId }: { currentArtistId?: string | null }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)

  const handleSearch = async () => {
    setLoading(true)
    const artists = await searchSpotifyArtists(query)
    setResults(artists)
    setLoading(false)
  }

  // FIX: Added closeButton to success toast
  const handleClaim = (artist: any) => {
    toast(`Link ${artist.name}?`, {
        description: "This will connect your profile to this artist.",
        action: {
            label: "Confirm",
            onClick: async () => {
                const toastId = toast.loading("Linking profile...")
                await claimArtist(artist.id, artist.image)
                toast.dismiss(toastId)
                toast.success("Profile Connected", {
                    closeButton: true, // Show X on success
                    description: `Successfully linked to ${artist.name}`
                })
            }
        }
    })
  }

  const handleSync = async () => {
    setSyncing(true);
    const toastId = toast.loading("Syncing catalog from Spotify...");

    const result = await importSpotifyCatalog();
    setSyncing(false);
    
    toast.dismiss(toastId);
    
    if (result.success) {
      toast.success("Sync Complete", {
        description: `Imported ${result.count} tracks.`,
        closeButton: true // Show X on final notification
      })
    } else {
      toast.error("Import Failed", {
        description: "Could not sync with Spotify.",
        closeButton: true // Show X on error
      })
    }
  }

  // NOTE: handleReset automatically hides the global close button because it uses the action/cancel buttons.
  const handleReset = () => {
    toast("Disconnect Spotify?", {
        description: "This removes Spotify-imported songs from your view.",
        action: {
            label: "Disconnect",
            onClick: async () => {
                const toastId = toast.loading("Disconnecting...");
                await resetSpotifyConnection();
                toast.dismiss(toastId);
                toast.success("Disconnected", { closeButton: true });
            }
        },
        cancel: {
            label: "Cancel",
            onClick: () => {}
        }
    })
  }

  if (currentArtistId) {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardContent className="pt-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-green-900">Spotify Connected</h3>
              <p className="text-sm text-green-700">Your profile is linked to ID: {currentArtistId}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
                onClick={handleSync} 
                disabled={syncing} 
                variant="outline" 
                className="bg-white border-green-300 text-green-700 hover:bg-green-100"
            >
                {syncing ? (
                    <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> 
                        Syncing...
                    </>
                ) : (
                    <>
                        <RefreshCw className="mr-2 h-4 w-4" /> 
                        Sync Catalog
                    </>
                )}
            </Button>

            <Button 
                onClick={handleReset} 
                variant="ghost" 
                size="icon" 
                title="Disconnect"
                className="hover:bg-red-100 hover:text-red-600"
            >
                <XCircle className="h-5 w-5 text-red-500" />
            </Button>
          </div>
          
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connect Spotify Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input 
            placeholder="Search artist name (e.g. TomEE)" 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
          />
          <Button onClick={handleSearch} disabled={loading}>
            {loading ? '...' : <Search className="h-4 w-4" />}
          </Button>
        </div>

        <div className="space-y-2">
          {results.map((artist) => (
            <div key={artist.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50">
              <div className="flex items-center gap-3">
                {artist.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={artist.image} alt={artist.name} className="h-10 w-10 rounded-full object-cover" />
                )}
                <div>
                  <p className="font-medium">{artist.name}</p>
                  <p className="text-xs text-gray-500">{artist.genres}</p>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => handleClaim(artist)}>
                This is me
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}