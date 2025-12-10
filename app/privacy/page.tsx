import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPage() {
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
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        <p className="text-muted-foreground mb-4">Last Updated: {new Date().toLocaleDateString()}</p>
        
        <div className="space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold mb-2">1. Information We Collect</h2>
            <p>We collect information you provide directly to us, including your name, email address, IPI number, and metadata related to your musical works (titles, ISRCs, splits).</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">2. How We Use Your Information</h2>
            <p>We use your information to operate and improve the Paperwork platform, facilitate collaboration between co-writers, and generate registration files (CWR) for music rights societies.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">3. Data Sharing</h2>
            <p>To provide our Service, we may transmit your song data to Performance Rights Organizations (such as ASCAP, BMI, The MLC) and other music rights administrators. We do not sell your personal data to third-party advertisers.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">4. Data Security</h2>
            <p>We implement reasonable security measures to protect your information. However, no method of transmission over the internet is 100% secure.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">5. Contact Us</h2>
            <p>If you have questions about this Privacy Policy, please contact us at <a href="mailto:support@paperworkmusic.com" className="text-primary hover:underline">support@paperworkmusic.com</a>.</p>
          </section>
        </div>
      </div>
    </div>
  )
}