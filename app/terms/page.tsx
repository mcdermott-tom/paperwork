import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="relative min-h-screen bg-background">

      {/* 1. ESCAPE HATCH (Back to Home) */}
      <div className="absolute top-4 left-4 md:top-8 md:left-8">
        <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
        </Link>
      </div>

      <div className="container mx-auto max-w-3xl py-24 px-6 text-foreground">
        <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
        <p className="text-muted-foreground mb-4">Last Updated: {new Date().toLocaleDateString()}</p>
        
        <div className="space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold mb-2">1. Acceptance of Terms</h2>
            <p>By creating an account or using Paperwork ("the Service"), you agree to be bound by these Terms. If you disagree with any part of the terms, you may not use the Service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">2. Nature of Service</h2>
            <p>Paperwork is a technology platform that assists songwriters and rights holders in organizing, managing, and registering their musical works. We are not a law firm and do not provide legal advice.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">3. User Responsibilities</h2>
            <p>You represent and warrant that all metadata, split percentages, and contributor information you enter into the Service is accurate and that you have the authority to register these works.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">4. Limitation of Liability</h2>
            <p>Paperwork Administration, LLC shall not be liable for any indirect, incidental, or consequential damages resulting from the use or inability to use the Service, including but not limited to lost royalties due to incorrect data entry.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">5. Intellectual Property</h2>
            <p>You retain full ownership of your musical copyrights. Paperwork claims no ownership stake in your compositions or master recordings.</p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-2">6. Contact</h2>
            <p>Questions regarding these Terms should be directed to <a href="mailto:support@paperworkmusic.com" className="text-primary hover:underline">support@paperworkmusic.com</a>.</p>
          </section>
        </div>
      </div>
    </div>
  )
}