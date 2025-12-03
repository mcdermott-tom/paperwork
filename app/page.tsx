import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    // FIX 1: Removed hardcoded background, relies on body/layout bg-background.
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4"> 
      
      {/* FIX 2: Explicitly use foreground color for high contrast */}
      <h1 className="text-4xl font-bold tracking-tight text-foreground">Paperwork</h1>
      
      {/* FIX 3: Use muted-foreground for softer description text */}
      <p className="text-muted-foreground">Royalty Management for Independent Artists</p>
      
      <div className="flex gap-4">
        <Link href="/login">
          <Button variant="outline">Log In</Button>
        </Link>
        <Link href="/dashboard">
          <Button>Go to Dashboard</Button>
        </Link>
      </div>
    </div>
  )
}