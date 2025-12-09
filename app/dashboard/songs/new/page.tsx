import { SearchSong } from './search-song'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import Link from 'next/link' // If you want to keep a manual option link

export default function NewSongPage() {
  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Add Song to Discography</CardTitle>
          <CardDescription>
            Search Spotify to instantly import metadata and claim your split.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SearchSong />
          
          <div className="mt-8 pt-6 border-t text-center text-sm text-slate-500">
            Can't find it on Spotify? 
            {/* You can re-enable the manual form later if needed */}
            <span className="block mt-1">
                (Manual entry is currently disabled in favor of Search)
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}