// app/dashboard/placements/status-badge.tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updatePlacementField } from './actions' // We use the action from yesterday
import { cn } from '@/lib/utils' // Assuming you have a cn utility, or just use template literals
import { Loader2 } from 'lucide-react'

interface Props {
  id: string
  type: 'PLACEMENT' | 'SPLIT'
  initialStatus: string
}

export function InteractiveStatusBadge({ id, type, initialStatus }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  // Normalize status for comparison
  const status = initialStatus.toLowerCase()

  // 1. Only Placements are editable via click. Splits are controlled by the Song lock.
  const isEditable = type === 'PLACEMENT'

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault() // Prevent row click
    if (!isEditable || isPending) return

    // Cycle Logic: Pending -> Invoiced -> Paid -> Pending
    let nextStatus = 'pending'
    if (status === 'pending') nextStatus = 'invoiced'
    else if (status === 'invoiced') nextStatus = 'paid'
    else if (status === 'paid') nextStatus = 'pending'

    // Optimistic UI (optional, but router.refresh handles the real data sync)
    startTransition(async () => {
        await updatePlacementField(id, 'feeStatus', nextStatus)
        router.refresh() // <--- This refreshes the Server Page (updating totals)
    })
  }

  // Styles Logic
  let badgeStyles = "bg-gray-100 text-gray-700 border-gray-200"
  if (status === 'paid' || status === 'active') badgeStyles = "bg-green-100 text-green-700 border-green-200"
  if (status === 'invoiced' || status === 'recouping') badgeStyles = "bg-yellow-100 text-yellow-800 border-yellow-200"
  if (status === 'pending') badgeStyles = "bg-blue-50 text-blue-700 border-blue-200"

  return (
    <button
      onClick={handleClick}
      disabled={!isEditable}
      className={cn(
        "px-2.5 py-0.5 rounded-full text-xs font-semibold border flex items-center gap-1 transition-all",
        badgeStyles,
        isEditable && "hover:opacity-80 cursor-pointer active:scale-95",
        !isEditable && "cursor-default opacity-90"
      )}
    >
      {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
      {initialStatus}
    </button>
  )
}