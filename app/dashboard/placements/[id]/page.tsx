import { getPlacement } from '../actions'
import { EditPlacementForm } from './edit-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

// FIXED: Define params as a Promise
type Props = {
  params: Promise<{ id: string }>
}

export default async function PlacementPage({ params }: Props) {
  // FIXED: Await the params object before accessing the ID
  const { id } = await params
  
  const placement = await getPlacement(id)

  if (!placement) {
    return notFound()
  }

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-3xl">
      <Link href="/dashboard/placements">
        <Button variant="ghost" className="pl-0 hover:pl-2 transition-all">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Tracker
        </Button>
      </Link>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{placement.client}</h1>
          <p className="text-muted-foreground">Placement for "{placement.song.title}"</p>
        </div>
      </div>

      <EditPlacementForm placement={placement} />
    </div>
  )
}