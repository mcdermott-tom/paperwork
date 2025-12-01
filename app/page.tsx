import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-gray-50">
      <h1 className="text-4xl font-bold tracking-tight">Paperwork</h1>
      <p className="text-gray-500">Royalty Management for Independent Artists</p>
      
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