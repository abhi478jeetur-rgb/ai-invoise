import { createClient } from '@/lib/db/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import AnimatedPreview from '@/components/shared/AnimatedPreview'
import AnimatedHeaderLogo from '@/components/shared/AnimatedHeaderLogo'
import AnimatedHeroBackground from '@/components/shared/AnimatedHeroBackground'
import AnimatedFooterCta from '@/components/shared/AnimatedFooterCta'
import AskLLMSection from '@/components/shared/AskLLMSection'
import {
  Shield,
  Copy,
  Clock,
  FileText,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react'
import { MobileLandingNav } from '@/components/shared/MobileLandingNav'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const ctaHref = user ? '/dashboard' : '/sign-up'
  const ctaLabel = user ? 'Go to Dashboard' : 'Get Started Free'

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 selection:bg-neutral-800">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-neutral-900/80 bg-neutral-950/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <AnimatedHeaderLogo />

            <nav className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors">
                Features
              </a>
              <a href="#why" className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors">
                Why ChaseFree
              </a>
              <a href="#testimonial" className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors">
                Testimonials
              </a>
            </nav>

            <div className="hidden md:flex items-center gap-2">
              {user ? (
                <Link href="/dashboard">
                  <Button size="sm" className="bg-white text-black hover:bg-neutral-200 text-xs font-medium cursor-pointer h-8">
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/sign-in">
                    <Button variant="ghost" size="sm" className="text-xs text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 cursor-pointer h-8">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/sign-up">
                    <Button size="sm" className="bg-white text-black hover:bg-neutral-200 text-xs font-medium cursor-pointer h-8">
                      Start Free
                    </Button>
                  </Link>
                </>
              )}
            </div>
            
            {/* Mobile Nav */}
            <MobileLandingNav user={user} />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.12),transparent)] pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-neutral-800/10 rounded-full blur-[120px] pointer-events-none" />
        <AnimatedHeroBackground />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 sm:pt-28 sm:pb-24">
          <div className="text-center max-w-3xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-neutral-800 bg-neutral-900/60 text-[11px] text-neutral-400 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Built for freelancers who hate chasing payments
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] bg-gradient-to-b from-white via-neutral-200 to-neutral-600 bg-clip-text text-transparent">
              Chasing Late Payments is Awkward. Let AI Do It Safely.
            </h1>

            {/* Subheadline */}
            <p className="mt-5 text-base sm:text-lg text-neutral-400 leading-relaxed max-w-2xl mx-auto">
              ChaseFree AI is a relationship-safe invoicing assistant for freelancers.
              Track unpaid invoices and generate perfect-tone reminder emails with a single click.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mt-8 px-4 sm:px-0">
              <Link href={ctaHref} className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto h-10 px-6 bg-white text-black hover:bg-neutral-200 font-medium text-sm cursor-pointer shadow-lg shadow-white/5">
                  {ctaLabel}
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
              <a href="#features" className="w-full sm:w-auto">
                <Button variant="ghost" className="w-full sm:w-auto h-10 px-6 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 font-medium text-sm cursor-pointer">
                  See Features
                </Button>
              </a>
            </div>
          </div>

          {/* Dashboard Mockup Preview */}
          <AnimatedPreview />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="border-t border-neutral-900/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">Core Features</p>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-100">
              Everything you need to get paid on time
            </h2>
            <p className="mt-3 text-sm text-neutral-500">
              No bloat. No accounting jargon. Just the tools a freelancer actually needs.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                icon: Shield,
                title: 'Relationship Protection',
                description:
                  'Choose between Friendly, Professional, Firm, or Final Notice tones to match the exact context of every delay. Protect both your cash flow and your client relationships.',
              },
              {
                icon: FileText,
                title: 'AES-256-CBC Secure Vault',
                description:
                  'Your AI provider API keys are cryptographically encrypted at rest on our server. We never see your keys, and neither does anyone else.',
              },
              {
                icon: Copy,
                title: 'Human-in-the-Loop Copy & Edit',
                description:
                  'Generates email drafts you can review, edit, and copy to clipboard in one second. We never send emails autonomously. You stay in full control.',
              },
              {
                icon: Clock,
                title: 'Dynamic Event Auditing',
                description:
                  'Every draft generation, clipboard copy, and payment event is captured in a chronological timeline. Full visibility into your follow-up history.',
              },
            ].map((feature, idx) => (
              <Card
                key={idx}
                className="border-neutral-900/80 bg-neutral-900/30 backdrop-blur-xl hover:bg-neutral-900/50 transition-colors"
              >
                <CardContent className="p-5">
                  <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-neutral-800/60 border border-neutral-700/50 mb-3">
                    <feature.icon className="w-4 h-4 text-neutral-400" />
                  </div>
                  <h3 className="text-sm font-medium text-neutral-200 mb-1">{feature.title}</h3>
                  <p className="text-xs text-neutral-500 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why ChaseFree Section */}
      <section id="why" className="border-t border-neutral-900/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">Why ChaseFree</p>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-100">
                Stop procrastinating on follow-ups
              </h2>
              <p className="mt-4 text-sm text-neutral-400 leading-relaxed">
                Freelancers lose thousands every year because chasing late payments feels
                awkward and emotionally draining. ChaseFree AI removes that friction entirely
                by giving you the right words at the right time.
              </p>

              <div className="mt-6 space-y-3">
                {[
                  'Know exactly who to chase each morning',
                  'Generate perfectly calibrated reminder emails instantly',
                  'Never damage a client relationship with the wrong tone',
                  'Track every interaction in one calm dashboard',
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-neutral-300">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-neutral-800/60 bg-neutral-900/40 p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg border border-neutral-800/40 bg-neutral-900/30">
                  <div className="w-1 h-10 rounded-full bg-red-500" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-neutral-200">Final Notice: Invoice #INV-0089</p>
                    <p className="text-[10px] text-neutral-500 mt-0.5">Acme Design Co. &middot; $3,200 &middot; 14 days overdue</p>
                  </div>
                  <span className="px-2 py-0.5 text-[9px] font-medium rounded bg-red-950/40 text-red-400 border border-red-900/50">Overdue</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border border-neutral-800/40 bg-neutral-900/30">
                  <div className="w-1 h-10 rounded-full bg-yellow-500" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-neutral-200">Professional: Invoice #INV-0091</p>
                    <p className="text-[10px] text-neutral-500 mt-0.5">Bright Spark Studio &middot; $1,800 &middot; Due in 2 days</p>
                  </div>
                  <span className="px-2 py-0.5 text-[9px] font-medium rounded bg-yellow-950/40 text-yellow-400 border border-yellow-900/50">Due Soon</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border border-neutral-800/40 bg-neutral-900/30">
                  <div className="w-1 h-10 rounded-full bg-blue-500" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-neutral-200">Friendly: Invoice #INV-0093</p>
                    <p className="text-[10px] text-neutral-500 mt-0.5">Nova Web Agency &middot; $5,600 &middot; Due in 5 days</p>
                  </div>
                  <span className="px-2 py-0.5 text-[9px] font-medium rounded bg-blue-950/40 text-blue-400 border border-blue-900/50">Sent</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section id="testimonial" className="border-t border-neutral-900/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">Testimonials</p>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-100 mb-10">
              Trusted by freelancers worldwide
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
            {[
              {
                quote:
                  "I used to delay sending late reminders for weeks because of the awkwardness. ChaseFree AI helped me collect $8,400 in outstanding invoices in my first month, keeping my client relations perfect!",
                name: 'Sarah K.',
                role: 'Creative Director',
              },
              {
                quote:
                  "The tone calibration is incredible. I went from dreading follow-ups to actually looking forward to clearing my overdue list. My clients barely notice it's a reminder because it sounds so natural.",
                name: 'Marcus L.',
                role: 'Freelance Developer',
              },
              {
                quote:
                  "Finally, a tool that understands the emotional weight of chasing money. The 'Who to Chase Today' dashboard is the calmest way to start my morning. Collected $12K in my first quarter.",
                name: 'Priya S.',
                role: 'Brand Consultant',
              },
            ].map((testimonial, idx) => (
              <Card
                key={idx}
                className="border-neutral-900/80 bg-neutral-900/30 backdrop-blur-xl"
              >
                <CardContent className="p-5">
                  <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                    &ldquo;{testimonial.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center">
                      <span className="text-[10px] font-medium text-neutral-400">
                        {testimonial.name[0]}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-neutral-300">{testimonial.name}</p>
                      <p className="text-[10px] text-neutral-500">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-neutral-900/80 py-20 px-4 sm:px-6 lg:px-8">
        <AnimatedFooterCta>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-100">
            Ready to stop chasing?
          </h2>
          <p className="mt-3 text-sm text-neutral-500 max-w-md mx-auto">
            Join thousands of freelancers who collect faster with less stress.
            Free to start, no credit card required.
          </p>
          <div className="mt-6">
            <Link href={ctaHref}>
              <Button className="h-10 px-6 bg-white text-black hover:bg-neutral-200 font-medium text-sm cursor-pointer shadow-lg shadow-white/5">
                {ctaLabel}
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        </AnimatedFooterCta>
      </section>

      {/* Ask LLM Section */}
      <AskLLMSection />

      {/* Footer */}
      <footer className="border-t border-neutral-900/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <AnimatedHeaderLogo />
            <p className="text-[11px] text-neutral-600">
              &copy; {new Date().getFullYear()} ChaseFree AI. Built for freelancers who deserve to get paid.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
