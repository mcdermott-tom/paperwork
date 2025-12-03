'use client'

import { useState } from 'react'
import { generateCWR } from './export-actions' 
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'

export function ExportCWRButton({ songId }: { songId: string }) {
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    setLoading(true);
    const result = await generateCWR(songId);
    setLoading(false);

    if (result.error) {
      alert(result.error);
      return;
    }

    if (result.content && result.filename) {
      const blob = new Blob([result.content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  }

  return (
    <Button onClick={handleDownload} variant="outline" size="sm" disabled={loading} className="gap-2">
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      Export CWR
    </Button>
  )
}