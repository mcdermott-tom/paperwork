// songs/[id]/pdf-button.tsx
'use client'

import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { FileDown, Loader2 } from 'lucide-react'

// Define the loading component outside the dynamic import
const LoadingButton = (
  <Button variant="outline" disabled className="gap-2">
    <Loader2 className="h-4 w-4 animate-spin" /> Generating PDF...
  </Button>
);


// CRITICAL FIX: Dynamically import BOTH the PDF renderer and the SplitSheetPDF component.
// This ensures that all Node-reliant code is only executed on the client.
const DynamicPDFLink = dynamic(
  () => 
    Promise.all([
      import('@react-pdf/renderer'),
      import('@/components/SplitSheetPDF'),
    ]).then(([rendererModule, docModule]) => {
      const PDFDownloadLink = rendererModule.PDFDownloadLink;
      const SplitSheetPDF = docModule.SplitSheetPDF;

      // Return the actual wrapper component that uses the dynamic imports
      // This function will render in the browser only.
      return ({ song, writers }: { song: any, writers: any[] }) => (
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
      );
    }),
  {
    ssr: false,
    loading: () => LoadingButton,
  }
);


export function DownloadSplitSheetButton({ song, writers }: { song: any, writers: any[] }) {
  // The main component now just passes the props to the dynamically loaded component
  return <DynamicPDFLink song={song} writers={writers} />;
}