import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, CheckCircle2, Shield, Search, FileSignature } from 'lucide-react'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      
      {/* 1. HERO SECTION */}
      <header className="flex flex-col items-center justify-center px-6 pt-32 pb-20 text-center lg:pt-48 lg:pb-32">
        <div className="mx-auto max-w-3xl space-y-8">
          
          {/* The "Beta" Badge - optional but looks cool */}
          <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-800 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
            <span className="flex h-2 w-2 rounded-full bg-blue-600 mr-2 animate-pulse"></span>
            Now accepting early access
          </div>

          <h1 className="text-5xl font-bold tracking-tight sm:text-7xl">
            DistroKid gets you on Spotify. <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
              Paperwork makes sure you own it.
            </span>
          </h1>
          
          <p className="mx-auto max-w-2xl text-xl text-muted-foreground leading-relaxed">
            The missing legal layer for independent artists. Secure your splits, sign your agreements, and stop leaving publishing money on the table.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/login">
              <Button size="lg" className="h-12 px-8 text-lg gap-2">
                Start for Free <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="h-12 px-8 text-lg">
                Log In
              </Button>
            </Link>
          </div>

          <p className="text-sm text-muted-foreground pt-4">
            No credit card required. Cancel anytime.
          </p>
        </div>
      </header>


      {/* 2. THE "HOW IT WORKS" GRID */}
      <section className="bg-slate-50 dark:bg-slate-900/50 py-24">
        <div className="container mx-auto px-6">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Don't let your hit be a headache.</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              We turned the boring legal stuff into a 3-step checklist.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-6xl mx-auto">
            
            {/* Feature 1 */}
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-16 w-16 bg-blue-100 dark:bg-blue-900/50 rounded-2xl flex items-center justify-center mb-2">
                <Search className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold">1. Search & Claim</h3>
              <p className="text-muted-foreground">
                Find your songs on Spotify instantly. We pull the metadata so you don't have to type it manually.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-16 w-16 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl flex items-center justify-center mb-2">
                <FileSignature className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold">2. Lock the Split</h3>
              <p className="text-muted-foreground">
                Send a magic link to your collaborators. They confirm their % in seconds. No PDFs, no printers.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-16 w-16 bg-emerald-100 dark:bg-emerald-900/50 rounded-2xl flex items-center justify-center mb-2">
                <Shield className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold">3. Get Paid</h3>
              <p className="text-muted-foreground">
                We generate the official CWR files needed to collect the 50% of publishing royalties that distributors miss.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 3. FOOTER / TRUST */}
      <footer className="py-12 text-center text-muted-foreground">
        <div className="container mx-auto px-6 border-t border-border pt-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="font-bold text-foreground">Paperwork</div>
            <div className="text-sm">
              &copy; {new Date().getFullYear()} Paperwork Administration, LLC. All rights reserved.
            </div>
            <div className="flex gap-6 text-sm">
              <Link href="#" className="hover:text-foreground">Terms</Link>
              <Link href="#" className="hover:text-foreground">Privacy</Link>
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}