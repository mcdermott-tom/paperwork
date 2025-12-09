'use client'

import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { FileDown, Loader2 } from 'lucide-react'
import React from 'react'

const LoadingBtn = () => (
  <Button variant="outline" disabled className="gap-2">
    <Loader2 className="h-4 w-4 animate-spin" />
    <span>Loading PDF...</span>
  </Button>
)

const PDFLinkComponent = dynamic(async () => {
  const { PDFDownloadLink } = await import('@react-pdf/renderer')
  
  // FIXED: Point to the correct location in /components
  // If your file is named differently (e.g. split-sheet-pdf.tsx), change the filename here.
  const { SplitSheetPDF } = await import('@/components/SplitSheetPDF') 

  return function PDFLinkWrapper({ song, writers }: { song: any, writers: any[] }) {
    return (
      <PDFDownloadLink
        document={<SplitSheetPDF song={song} writers={writers} />}
        fileName={`${song.title.replace(/\s+/g, '_')}_Split_Sheet.pdf`}
      >
        {/* @ts-ignore */}
        {({ loading }) => (
          <Button variant="outline" disabled={loading} className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            {loading ? 'Generating...' : 'Download Split Sheet'}
          </Button>
        )}
      </PDFDownloadLink>
    )
  }
}, {
  ssr: false,
  loading: LoadingBtn
})

export function DownloadSplitSheetButton({ song, writers }: { song: any, writers: any[] }) {
  return <PDFLinkComponent song={song} writers={writers} />
}