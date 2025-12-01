'use client'

import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { FileDown, Loader2 } from 'lucide-react'

// Dynamically import PDFDownloadLink to avoid SSR issues
const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
  {
    ssr: false,
    loading: () => (
      <Button variant="outline" disabled className="gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading PDF...
      </Button>
    ),
  }
)

import { SplitSheetPDF } from '@/components/SplitSheetPDF'

export function DownloadSplitSheetButton({ song, writers }: { song: any, writers: any[] }) {
  return (
    <PDFDownloadLink
      document={<SplitSheetPDF song={song} writers={writers} />}
      fileName={`${song.title.replace(/\s+/g, '_')}_Split_Sheet.pdf`}
    >
      {/* @ts-ignore -- react-pdf types sometimes conflict with children rendering */}
      {({ blob, url, loading, error }) => (
        <Button variant="outline" disabled={loading} className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
          {loading ? 'Generating...' : 'Download Split Sheet'}
        </Button>
      )}
    </PDFDownloadLink>
  )
}