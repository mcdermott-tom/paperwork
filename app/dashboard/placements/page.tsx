// app/dashboard/placements/page.tsx

import { getUnifiedIncome } from './actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Wallet, Clapperboard, Music2, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

// Helper for currency
const formatMoney = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export default async function UnifiedTrackerPage() {
  // Fetch the merged data
  const items = await getUnifiedIncome()

  // Calculate Total Value (Advances + Fees)
  const totalValue = items.reduce((sum, item) => sum + item.amount, 0)

  return (
    <div className="container mx-auto p-6 space-y-6">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Income Tracker</h1>
          <p className="text-gray-500">Unified view of placements and split advances.</p>
        </div>
        <div className="flex gap-2">
           {/* Link back to songs to manage splits */}
           <Link href="/dashboard/songs">
             <Button variant="outline">Manage Splits</Button>
           </Link>
           {/* Link to create a new placement */}
           <Link href="/dashboard/placements/new">
             <Button>+ Log Placement</Button>
           </Link>
        </div>
      </div>

      {/* SUMMARY STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-50 border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">Total Tracked Value</CardTitle>
                <Wallet className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-slate-900">{formatMoney(totalValue)}</div>
                <p className="text-xs text-slate-500">Combined Fees & Advances</p>
            </CardContent>
        </Card>
      </div>

      {/* UNIFIED TABLE */}
      <Card>
        <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Source / Context</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Value</TableHead>
                        <TableHead></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center h-24 text-gray-500">
                                No income items found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        items.map((item) => (
                            <TableRow key={`${item.type}-${item.id}`}>
                                <TableCell>
                                    {item.type === 'PLACEMENT' ? (
                                        <Badge className="bg-blue-600 hover:bg-blue-700">
                                            <Clapperboard className="w-3 h-3 mr-1" /> Placement
                                        </Badge>
                                    ) : (
                                        <Badge variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-200">
                                            <Music2 className="w-3 h-3 mr-1" /> Split
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell className="font-medium">
                                    {item.title}
                                </TableCell>
                                <TableCell className="text-gray-500">
                                    {item.subtitle}
                                </TableCell>
                                <TableCell>
                                    <StatusBadge status={item.status} />
                                </TableCell>
                                <TableCell className="text-right font-mono font-medium">
                                    {item.amount > 0 ? formatMoney(item.amount) : '-'}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Link href={`/dashboard/songs/${item.songId}`}>
                                        <Button variant="ghost" size="icon">
                                            <ArrowUpRight className="h-4 w-4 text-gray-400" />
                                        </Button>
                                    </Link>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  )
}

// Small helper component for the Status Badge color logic
function StatusBadge({ status }: { status: string }) {
    const s = status.toLowerCase()
    let styles = "bg-gray-100 text-gray-700"

    if (s === 'paid' || s === 'active') styles = "bg-green-100 text-green-700"
    if (s === 'invoiced' || s === 'recouping') styles = "bg-yellow-100 text-yellow-800 border-yellow-200"
    if (s === 'pending') styles = "bg-blue-50 text-blue-700"

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${styles}`}>
            {status}
        </span>
    )
}