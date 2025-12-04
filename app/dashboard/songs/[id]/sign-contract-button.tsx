'use client'

import { useState } from 'react'
import { signAndFinalizeSplitSheet } from './signing-action' 
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function SignContractButton({ songId }: { songId: string }) {
  const [isLoading, setIsLoading] = useState(false)

  const handleSignClick = () => {
    // 1. CLEANUP: Dismiss all existing toasts so they don't stack up
    toast.dismiss()

    // 2. Show the new confirmation
    toast("Confirm Signature", {
      description: "By clicking Confirm, you are digitally signing this split sheet. This will LOCK the song details and record your IP address.",
      duration: 8000,
      action: {
        label: "Confirm",
        onClick: async () => {
          setIsLoading(true)
          
          // Dismiss the "Confirm" toast immediately so the "Loading" toast takes its place
          toast.dismiss() 
          const toastId = toast.loading("Signing contract...")

          try {
            const result = await signAndFinalizeSplitSheet(songId)
            toast.dismiss(toastId)

            if (result.error) {
              toast.error("Signing Failed", {
                description: result.error,
                closeButton: true
              })
            } else {
              toast.success("Contract Signed and Archived!", {
                description: "The split sheet is now locked.",
                closeButton: true 
              })
            }
          } catch (err) {
            toast.dismiss(toastId)
            toast.error("System Error", {
              description: "Something went wrong. Please try again.",
              closeButton: true
            })
          } finally {
            setIsLoading(false)
          }
        },
      },
      cancel: {
        label: "Cancel",
        onClick: () => toast.dismiss(), // Dismiss if they cancel too
      },
    })
  }

  return (
    <Button 
      variant="default" 
      disabled={isLoading} 
      onClick={handleSignClick}
    >
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign Contract"}
    </Button>
  )
}