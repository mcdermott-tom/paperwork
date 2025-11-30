// app/dashboard/page.tsx

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
// Import Recharts components here if you install them (e.g., LineChart, Line, XAxis, Tooltip)

// Placeholder data for the template
const mockSongs = [
  { id: '1', title: 'Eternal Sunshine', iswc: 'T-900.001.001-1', split: '50%' },
  { id: '2', title: 'Electric Dreams', iswc: 'T-900.002.002-2', split: '75%' },
]
const mockSources = ['Spotify (Curve API)', 'YouTube Content ID', 'ASCAP CSV Upload', 'DistroKid']

export default function DashboardPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Artist Dashboard</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* TOP LEFT: List of User's Registered Songs */}
        <Card className="col-span-1 min-h-[400px]">
          <CardHeader>
            <CardTitle>Registered Compositions</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>ISWC</TableHead>
                  <TableHead className="text-right">Split</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockSongs.map((song) => (
                  <TableRow key={song.id}>
                    <TableCell className="font-medium">{song.title}</TableCell>
                    <TableCell>{song.iswc}</TableCell>
                    <TableCell className="text-right">{song.split}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* TOP RIGHT: Line Graph of Money Made */}
        <Card className="col-span-1 min-h-[400px]">
          <CardHeader>
            <CardTitle>Royalty Performance (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            {/* Placeholder for Recharts Line Chart */}
            <div className="text-gray-400 border border-dashed p-4 w-full h-full flex items-center justify-center">
                Line Graph Component (Install Recharts)
            </div>
          </CardContent>
        </Card>

        {/* BOTTOM LEFT: List of User's Bands/Artists */}
        <Card className="col-span-1 min-h-[300px]">
          <CardHeader>
            <CardTitle>Associated Artist Names</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-medium">Tommy McDermott (Primary)</p>
            <p className="text-sm text-gray-600">The Paperwork Project</p>
            <p className="text-sm text-gray-600">FT. Miles Commodore (External)</p>
          </CardContent>
        </Card>

        {/* BOTTOM RIGHT: List of Data Sources */}
        <Card className="col-span-1 min-h-[300px]">
          <CardHeader>
            <CardTitle>Active Royalty Data Sources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <ul className="list-disc list-inside space-y-1">
              {mockSources.map((source, index) => (
                <li key={index} className="text-sm">{source}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}