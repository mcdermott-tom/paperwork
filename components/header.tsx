// components/header.tsx
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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true)
    async function fetchUserAvatar() {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: profile } = await supabase
                .from('User')
                .select('avatarUrl')
                .eq('id', user.id)
                .single()
            if (profile && profile.avatarUrl) {
                setAvatarUrl(profile.avatarUrl)
            }
        }
    }
    fetchUserAvatar();
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b px-6 bg-background">
        <div className="flex items-center">
           {/* Placeholder for text logo */}
           <div className="h-8 w-32 bg-muted/50 rounded animate-pulse" /> 
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b px-6 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 text-[#1f7a8c] dark:text-[#bfdbf7]">
      
      {/* Left: Text Logo (Increased Font Size) */}
      <Link href="/dashboard" className="flex items-center gap-2 transition-opacity hover:opacity-80">
        <span className="text-4xl font-bold tracking-tight font-sans">
          Paperwork
        </span>
      </Link>

      {/* Right: Navigation & Profile */}
      <div className="flex items-center gap-6">
        <nav className="flex items-center gap-4 text-sm font-medium">
          
          {/* Direct Link for Placements (Moved to Left) */}
          <Link href="/dashboard/placements" className="hover:text-primary transition-colors">
            Placements
          </Link>
          
          <DropdownMenu>
            <DropdownMenuTrigger className="hover:text-primary transition-colors">Releases ▾</DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem><Link href="/dashboard/releases">View All</Link></DropdownMenuItem>
              <DropdownMenuItem><Link href="/dashboard/releases/new">New Release</Link></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger className="hover:text-primary transition-colors">Songs ▾</DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem><Link href="/dashboard/songs">View All</Link></DropdownMenuItem>
              <DropdownMenuItem><Link href="/dashboard/songs/new">New Song</Link></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger className="hover:text-primary transition-colors">Splits ▾</DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem><Link href="/dashboard/splits">My Splits</Link></DropdownMenuItem>
              <DropdownMenuItem disabled className="text-muted-foreground">Archive (Coming Soon)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        {/* Profile Icon */}
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Avatar className="h-8 w-8 cursor-pointer border border-primary/20">
              <AvatarImage src={avatarUrl || undefined} className="object-cover" /> 
              <AvatarFallback className="bg-primary/10 text-primary"><User className="h-4 w-4" /></AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href="/dashboard/profile" className="cursor-pointer w-full">Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer focus:text-destructive">
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}