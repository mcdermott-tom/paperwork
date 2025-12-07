'use client'

import { useState } from 'react'
import { FileSignature, Loader2, CheckCircle } from 'lucide-react'
import { generateLOD } from './actions' // Server action we'll define below
import { toast } from 'sonner' // Assuming you use sonner/hot-toast

interface SignContractButtonProps {
  songId: string
  songTitle: string
  userLegalName: string
}

export const SignContractButton = ({ songId, songTitle, userLegalName }: SignContractButtonProps) => {
  const [status, setStatus] = useState<'idle' | 'signing' | 'signed'>('idle')

  const handleSign = async () => {
    if (!userLegalName) {
      toast.error("Please update your profile with your Legal Name first.")
      return
    }

    setStatus('signing')

    try {
      // 1. Trigger Server Action to generate PDF and log the timestamp
      const result = await generateLOD(songId)
      
      if (result.error) throw new Error(result.error)

      // 2. Success State
      setStatus('signed')
      toast.success(`Contract Signed for "${songTitle}"`)
      
      // Optional: Auto-download the PDF for their records
      // window.open(result.pdfUrl, '_blank')

    } catch (err) {
      console.error(err)
      toast.error("Failed to sign contract. Please try again.")
      setStatus('idle')
    }
  }

  if (status === 'signed') {
    return (
      <button disabled className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-md border border-green-200 cursor-default">
        <CheckCircle className="w-4 h-4" />
        <span>Signed & Processing</span>
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleSign}
        disabled={status === 'signing'}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors shadow-sm disabled:opacity-50"
      >
        {status === 'signing' ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FileSignature className="w-4 h-4" />
        )}
        <span>Sign Admin Agreement (20%)</span>
      </button>
      <p className="text-[10px] text-gray-500 max-w-[200px] leading-tight">
        By clicking, you authorize Paperwork to collect unclaimed royalties for this work. You retain 100% copyright ownership.
      </p>
    </div>
  )
}