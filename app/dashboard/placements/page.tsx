// app/dashboard/placements/page.tsx

import { getUnifiedIncome } from './actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Wallet, Clapperboard, Music2, ArrowUpRight, CircleDashed } from 'lucide-react'
import Link from 'next/link'
import { InteractiveStatusBadge } from './status-badge'

// Helper for currency
const formatMoney = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

// Utility for Conditional Classes
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ')
}

export default async function UnifiedTrackerPage() {
  // Fetch the merged data
  const items = await getUnifiedIncome()

  // Calculate Totals
  const totalValue = items.reduce((sum, item) => sum + item.amount, 0)
  
  // Calculate "Paid" vs "Pending"
  const totalCollected = items
    .filter(i => i.status.toLowerCase() === 'paid' || i.status.toLowerCase() === 'active')
    .reduce((sum, item) => sum + item.amount, 0)

  const pendingAmount = totalValue - totalCollected
  const isFullyCollected = totalCollected === totalValue && totalValue > 0

  return (
    <div className="container mx-auto p-6 space-y-6">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Income Tracker</h1>
          <p className="text-gray-500">Unified view of placements and split advances.</p>
        </div>
        <div className="flex gap-2">
           <Link href="/dashboard/songs">
             <Button variant="outline">Manage Splits</Button>
           </Link>
           <Link href="/dashboard/placements/new">
             <Button>+ Log Placement</Button>
           </Link>
        </div>
      </div>

      {/* SUMMARY STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* CARD 1: PENDING / OUTSTANDING (Leftmost) */}
        <Card className="bg-amber-50 border-amber-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-amber-900">Outstanding (Pending)</CardTitle>
                <CircleDashed className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-amber-700">
                    {formatMoney(pendingAmount)}
                </div>
                <div className="text-xs text-amber-600/80 mt-1">
                    Waiting for collection
                </div>
            </CardContent>
        </Card>

        {/* CARD 2: TOTAL TRACKED VALUE */}
        <Card className="bg-slate-50 border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">Total Tracked Value</CardTitle>
                <Wallet className={`h-4 w-4 ${isFullyCollected ? 'text-green-600' : 'text-blue-600'}`} />
            </CardHeader>
            <CardContent>
                <div className={cn(
                    "text-2xl font-bold",
                    isFullyCollected ? "text-green-700" : "text-slate-900"
                )}>
                    {formatMoney(totalValue)}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                    Combined Fees & Advances
                </div>
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
                                        <Badge className="bg-blue-600 hover:bg-blue-700 w-fit">
                                            <Clapperboard className="w-3 h-3 mr-1" /> Placement
                                        </Badge>
                                    ) : (
                                        <Badge variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-200 w-fit">
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
                                    <InteractiveStatusBadge 
                                        id={item.id} 
                                        type={item.type} 
                                        initialStatus={item.status} 
                                    />
                                </TableCell>
                                <TableCell className="text-right font-mono font-medium">
                                    {item.amount > 0 ? formatMoney(item.amount) : '-'}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Link href={
                                        item.type === 'PLACEMENT' 
                                        ? `/dashboard/placements/${item.id}` 
                                        : `/dashboard/songs/${item.songId}`
                                    }>
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