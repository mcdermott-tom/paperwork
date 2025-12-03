'use client'

import { useState } from 'react'
import { signAndFinalizeSplitSheet } from '../signing-action'
import { Button } from '@/components/ui/button'
import { PenTool, Loader2, CheckCircle } from 'lucide-react'

export function SignContractButton({ songId, hasSigned }: { songId: string, hasSigned: boolean }) {
  const [loading, setLoading] = useState(false)

  const handleSign = async () => {
    if (!confirm("By clicking OK, you are digitally signing this split sheet. This will LOCK the song details and record your IP address.")) return;
    
    setLoading(true)
    const result = await signAndFinalizeSplitSheet(songId)
    setLoading(false)

    if (result?.error) {
      alert(result.error)
    } else {
      alert("Contract Signed and Archived!")
    }
  }

  if (hasSigned) {
    return (
      <Button variant="outline" disabled className="gap-2 border-green-200 bg-green-50 text-green-700">
        <CheckCircle className="h-4 w-4" /> Contract Signed
      </Button>
    )
  }

  return (
    <Button onClick={handleSign} disabled={loading} className="gap-2">
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PenTool className="h-4 w-4" />}
      {loading ? 'Finalizing...' : 'Finalize & Sign'}
    </Button>
  )
}