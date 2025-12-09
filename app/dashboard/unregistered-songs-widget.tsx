'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

interface WidgetProps {
  songs: {
    id: string
    title: string
    artist: string 
    missingItems: string[]
  }[]
}

export function UnregisteredSongsWidget({ songs }: WidgetProps) {
  // STATE: ALL GOOD (Empty List)
  if (songs.length === 0) {
    return (
      <Card className="col-span-1 min-h-[350px] border-emerald-200 bg-emerald-50 dark:bg-card dark:border-emerald-500/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
            All Caught Up!
          </CardTitle>
          <CardDescription className="text-emerald-600 dark:text-emerald-500">
            Every song in your catalog is fully registered.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
           <div className="text-center space-y-2">
             <p className="text-sm text-emerald-600 dark:text-emerald-400">Time to make more music.</p>
             <Link href="/dashboard/songs/new">
                <Button variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950">
                   Add Another Song
                </Button>
             </Link>
           </div>
        </CardContent>
      </Card>
    )
  }

  // STATE: ACTION REQUIRED
  return (
    <Card className="col-span-1 min-h-[350px] border-orange-200 bg-orange-50 dark:bg-card dark:border-orange-500/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-400">
            <AlertCircle className="h-5 w-5" />
            Action Required
        </CardTitle>
        <CardDescription className="text-orange-700 dark:text-orange-500">
            {songs.length} {songs.length === 1 ? 'song is' : 'songs are'} missing critical legal data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {songs.slice(0, 3).map((song) => (
            <div 
                key={song.id} 
                // Light: White box. Dark: Very dark slate box (darker than card) to make text pop.
                className="p-3 rounded-lg border shadow-sm flex items-center justify-between
                           bg-white border-orange-100 
                           dark:bg-slate-950 dark:border-orange-900/50"
            >
                <div>
                    <div className="font-medium text-slate-900 dark:text-slate-200">{song.title}</div>
                    <div className="text-xs font-medium flex gap-1 mt-0.5 text-orange-600 dark:text-orange-400">
                        {song.missingItems.join(" • ")}
                    </div>
                </div>
                <Link href={`/dashboard/songs/${song.id}`}>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-orange-600 dark:text-slate-500 dark:hover:text-orange-400">
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </Link>
            </div>
        ))}

        {songs.length > 3 && (
            <div className="text-center pt-2">
                <Link href="/dashboard/songs?filter=incomplete" className="text-xs text-orange-700 hover:underline font-medium dark:text-orange-400">
                    View all {songs.length} issues
                </Link>
            </div>
        )}
      </CardContent>
    </Card>
  )
}