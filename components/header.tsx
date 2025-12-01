'use client'

import Link from 'next/link'
import { User } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useState, useEffect } from 'react'

export function Header() {
  const router = useRouter()
  const supabase = createClient()
  const [mounted, setMounted] = useState(false)

  // Fix hydration mismatch by only rendering complex interactive elements after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  // Prevent hydration mismatch for the user dropdown
  if (!mounted) {
    return (
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b px-6 bg-white">
        <div className="flex items-center">
           {/* Static Logo Placeholder to prevent layout shift */}
           <div className="h-6 w-[120px]" /> 
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b px-6 bg-white">
      {/* Left: Logo & Dashboard Link */}
      <Link href="/dashboard" className="flex items-center">
        <img 
          src="/images/paperwork-logo.png" 
          alt="Paperwork Logo" 
          width={120} 
          height={24}
          className="h-6 w-auto" 
        />
      </Link>

      {/* Right: Navigation & Profile */}
      <div className="flex items-center gap-6">
        <nav className="flex items-center gap-4 text-sm font-medium">
          <DropdownMenu>
            <DropdownMenuTrigger className="hover:text-gray-600 transition-colors">Releases ▾</DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem><Link href="/dashboard/releases">View All</Link></DropdownMenuItem>
              <DropdownMenuItem><Link href="/dashboard/releases/new">New Release</Link></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger className="hover:text-gray-600 transition-colors">Songs ▾</DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem><Link href="/dashboard/ingest">Import CSV</Link></DropdownMenuItem>
              <DropdownMenuItem><Link href="/dashboard/songs">View All</Link></DropdownMenuItem>
              <DropdownMenuItem><Link href="/dashboard/songs/new">New Song</Link></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger className="hover:text-gray-600 transition-colors">Splits ▾</DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem><Link href="/splits">Pending</Link></DropdownMenuItem>
              <DropdownMenuItem><Link href="/splits/archive">Archive</Link></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        {/* Profile Icon */}
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Avatar className="h-8 w-8 cursor-pointer">
              <AvatarImage src="" /> 
              <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href="/dashboard/profile" className="cursor-pointer w-full">Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}