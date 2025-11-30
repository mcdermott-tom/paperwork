import { SongForm } from './song-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function NewSongPage() {
  return (
    <div className="container mx-auto p-6 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Register New Song</CardTitle>
        </CardHeader>
        <CardContent>
          <SongForm />
        </CardContent>
      </Card>
    </div>
  )
}