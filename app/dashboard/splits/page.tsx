import { db } from '@/lib/db'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight } from 'lucide-react'

async function getMySplits() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Fetch every split where I am a writer
  // We use @ts-ignore here because the include type inference is lagging
  // @ts-ignore 
  return await db.writerSplit.findMany({
    where: { userId: user.id },
    include: {
      song: {
        select: {
          id: true,
          title: true,
          iswc: true,
          isLocked: true, 
          createdAt: true
        }
      }
    },
    // FIX: Ensure you ran 'db push' so 'createdAt' exists, otherwise remove this line.
    orderBy: { createdAt: 'desc' } 
  })
}

export default async function SplitsPage() {
  const splits = await getMySplits()

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Equity & Splits</h1>
        <p className="text-muted-foreground">Your ownership stakes across all compositions.</p>
      </div>

      <div className="grid gap-6">
        <Card className="border-t-4 border-t-primary shadow-sm">
          <CardHeader>
            <CardTitle>Active Agreements</CardTitle>
            <CardDescription>You are a registered writer on {splits.length} songs.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Composition</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Your Share</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Contract</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {splits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      No splits found. Start by creating a song.
                    </TableCell>
                  </TableRow>
                ) : (
                  splits.map((split: any) => ( // Typed as any to bypass the stale cache error
                    <TableRow key={split.id} className="group">
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{split.song.title}</span>
                          <span className="text-xs text-muted-foreground font-mono">{split.song.iswc || 'No ISWC'}</span>
                        </div>
                      </TableCell>
                      <TableCell>{split.role}</TableCell>
                      <TableCell>
                        <span className="font-bold text-primary">{Number(split.percentage)}%</span>
                      </TableCell>
                      <TableCell>
                        {split.song.isLocked ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">Signed & Locked</Badge>
                        ) : (
                          <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50">Draft / Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/dashboard/songs/${split.song.id}`}>
                          <Button variant="ghost" size="sm" className="gap-2 group-hover:text-primary">
                            View Deal <ArrowRight className="h-4 w-4" />
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
    </div>
  )
}