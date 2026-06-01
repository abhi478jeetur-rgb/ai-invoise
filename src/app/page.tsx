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

            <div className="flex items-center gap-2">
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
            <div className="flex items-center justify-center gap-3 mt-8">
              <Link href={ctaHref}>
                <Button className="h-10 px-6 bg-white text-black hover:bg-neutral-200 font-medium text-sm cursor-pointer shadow-lg shadow-white/5">
                  {ctaLabel}
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
              <a href="#features">
                <Button variant="ghost" className="h-10 px-6 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 font-medium text-sm cursor-pointer">
                  See Features
                </Button>
              </a>
            </div>
          </div>

          {/* Video Demo Placeholder */}
          <div className="mt-20 mx-auto max-w-5xl relative group perspective-1000">
            <div className="absolute -inset-1 bg-gradient-to-r from-neutral-800 via-neutral-600 to-neutral-800 rounded-2xl blur-md opacity-40 group-hover:opacity-70 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative rounded-2xl border border-neutral-800/80 bg-neutral-950/80 backdrop-blur-xl aspect-video flex flex-col items-center justify-center overflow-hidden shadow-2xl transition-transform duration-700 ease-out hover:scale-[1.01]">
              <div className="absolute inset-0 bg-neutral-900/50 z-10 flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 mb-4 cursor-pointer hover:bg-white/20 transition-colors">
                  <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                </div>
                <p className="text-sm font-medium text-neutral-400">Watch the Demo Video (Placeholder)</p>
              </div>
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            </div>
          </div>
          
          {/* Trust Banner */}
          <div className="mt-20 pt-10 border-t border-neutral-900/50">
            <p className="text-center text-xs font-medium text-neutral-600 uppercase tracking-widest mb-6">Powered by industry leaders</p>
            <div className="flex flex-wrap justify-center items-center gap-8 sm:gap-16 opacity-50 grayscale">
              {/* Fake Logos - purely for aesthetic placeholder */}
              <div className="text-lg font-bold tracking-tighter text-neutral-400 flex items-center gap-1"><span className="w-4 h-4 rounded-full bg-neutral-400 inline-block"></span> OpenAI</div>
              <div className="text-lg font-bold tracking-tighter text-neutral-400 flex items-center gap-1"><span className="w-4 h-4 rounded-sm bg-neutral-400 inline-block"></span> Supabase</div>
              <div className="text-lg font-bold tracking-tighter text-neutral-400 flex items-center gap-1"><span className="w-4 h-4 rotate-45 bg-neutral-400 inline-block"></span> Vercel</div>
              <div className="text-lg font-bold tracking-tighter text-neutral-400 flex items-center gap-1"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 22h20L12 2z"/></svg> Stripe</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Bento Grid */}
      <section id="features" className="border-t border-neutral-900/80 relative">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-neutral-700/50 to-transparent"></div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-32 sm:py-40">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-100 bg-gradient-to-br from-white to-neutral-500 bg-clip-text text-transparent">
              Everything you need to get paid.
            </h2>
            <p className="mt-4 text-base text-neutral-400">
              No bloat. No complex accounting jargon. Just the intelligent tools a freelancer actually needs.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 grid-rows-2">
            {/* Bento Item 1: Large (Spans 2 columns) */}
            <div className="sm:col-span-2 group relative overflow-hidden rounded-2xl border border-neutral-800/60 bg-neutral-900/30 p-8 hover:bg-neutral-900/50 transition-colors">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-700 mb-5 shadow-sm">
                  <Shield className="w-5 h-5 text-neutral-300" />
                </div>
                <h3 className="text-lg font-medium text-neutral-100 mb-2 tracking-tight">Relationship Protection</h3>
                <p className="text-sm text-neutral-400 leading-relaxed max-w-md">
                  Choose between Friendly, Professional, Firm, or Final Notice tones to match the exact context of every delay. Protect both your cash flow and your client relationships effortlessly.
                </p>
              </div>
            </div>

            {/* Bento Item 2: Small */}
            <div className="group relative overflow-hidden rounded-2xl border border-neutral-800/60 bg-neutral-900/30 p-8 hover:bg-neutral-900/50 transition-colors">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-700 mb-5 shadow-sm">
                  <FileText className="w-5 h-5 text-neutral-300" />
                </div>
                <h3 className="text-lg font-medium text-neutral-100 mb-2 tracking-tight">Secure Vault</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  Your AI provider API keys are cryptographically encrypted at rest. We never see your keys.
                </p>
              </div>
            </div>

            {/* Bento Item 3: Small */}
            <div className="group relative overflow-hidden rounded-2xl border border-neutral-800/60 bg-neutral-900/30 p-8 hover:bg-neutral-900/50 transition-colors">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-700 mb-5 shadow-sm">
                  <Copy className="w-5 h-5 text-neutral-300" />
                </div>
                <h3 className="text-lg font-medium text-neutral-100 mb-2 tracking-tight">Human-in-the-Loop</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  Review, edit, and copy to clipboard in one second. You stay in full control always.
                </p>
              </div>
            </div>

            {/* Bento Item 4: Large (Spans 2 columns) */}
            <div className="sm:col-span-2 group relative overflow-hidden rounded-2xl border border-neutral-800/60 bg-neutral-900/30 p-8 hover:bg-neutral-900/50 transition-colors">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                <div className="flex-1">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-700 mb-5 shadow-sm">
                    <Clock className="w-5 h-5 text-neutral-300" />
                  </div>
                  <h3 className="text-lg font-medium text-neutral-100 mb-2 tracking-tight">Dynamic Event Auditing</h3>
                  <p className="text-sm text-neutral-400 leading-relaxed">
                    Every draft generation, clipboard copy, and payment event is captured in a chronological timeline. Get full visibility into your follow-up history.
                  </p>
                </div>
                <div className="hidden sm:block w-32 h-32 rounded-full border-[6px] border-neutral-800 flex items-center justify-center relative">
                    <div className="absolute w-1 h-12 bg-neutral-500 rounded-full origin-bottom rotate-[45deg] -translate-y-6"></div>
                    <div className="absolute w-1 h-8 bg-neutral-300 rounded-full origin-bottom rotate-[135deg] -translate-y-4"></div>
                    <div className="w-3 h-3 bg-neutral-200 rounded-full z-10"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why ChaseFree Section */}
      <section id="why" className="border-t border-neutral-900/80 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-32 sm:py-40">
          <div className="grid gap-16 lg:grid-cols-2 items-center">
            <div>
              <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-[0.2em] mb-4">Why ChaseFree</p>
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-100 bg-gradient-to-br from-white to-neutral-400 bg-clip-text text-transparent">
                Stop procrastinating on follow-ups.
              </h2>
              <p className="mt-5 text-base text-neutral-400 leading-relaxed">
                Freelancers lose thousands every year because chasing late payments feels
                awkward and emotionally draining. ChaseFree AI removes that friction entirely
                by giving you the right words at the right time.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  'Know exactly who to chase each morning',
                  'Generate perfectly calibrated reminder emails instantly',
                  'Never damage a client relationship with the wrong tone',
                  'Track every interaction in one calm dashboard',
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 group">
                    <div className="w-5 h-5 rounded-full bg-neutral-900 border border-neutral-700 flex items-center justify-center shrink-0 mt-0.5 group-hover:border-neutral-500 group-hover:bg-neutral-800 transition-colors">
                      <CheckCircle2 className="w-3 h-3 text-neutral-400 group-hover:text-white transition-colors" />
                    </div>
                    <p className="text-sm text-neutral-300 font-medium group-hover:text-white transition-colors">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative group perspective-1000">
              <div className="absolute -inset-2 bg-gradient-to-tr from-neutral-800 to-transparent rounded-2xl blur-lg opacity-20 group-hover:opacity-40 transition duration-700"></div>
              <div className="relative rounded-2xl border border-neutral-800/60 bg-neutral-950/80 p-6 sm:p-8 backdrop-blur-xl shadow-2xl transition-transform duration-700 ease-out hover:-rotate-y-2 hover:rotate-x-2">
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 rounded-xl border border-neutral-800/50 bg-neutral-900/50 transition-all hover:bg-neutral-900/80 hover:translate-x-1 cursor-default">
                    <div className="w-1.5 h-10 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-neutral-200 tracking-tight">Final Notice: Invoice #INV-0089</p>
                      <p className="text-[11px] text-neutral-500 mt-1">Acme Design Co. &middot; $3,200 &middot; 14 days overdue</p>
                    </div>
                    <span className="px-2.5 py-1 text-[10px] font-semibold tracking-wide rounded-md bg-red-500/10 text-red-400 border border-red-500/20">OVERDUE</span>
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-xl border border-neutral-800/50 bg-neutral-900/50 transition-all hover:bg-neutral-900/80 hover:translate-x-1 cursor-default">
                    <div className="w-1.5 h-10 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-neutral-200 tracking-tight">Professional: Invoice #INV-0091</p>
                      <p className="text-[11px] text-neutral-500 mt-1">Bright Spark Studio &middot; $1,800 &middot; Due in 2 days</p>
                    </div>
                    <span className="px-2.5 py-1 text-[10px] font-semibold tracking-wide rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">DUE SOON</span>
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-xl border border-neutral-800/50 bg-neutral-900/50 transition-all hover:bg-neutral-900/80 hover:translate-x-1 cursor-default">
                    <div className="w-1.5 h-10 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-neutral-200 tracking-tight">Friendly: Invoice #INV-0093</p>
                      <p className="text-[11px] text-neutral-500 mt-1">Nova Web Agency &middot; $5,600 &middot; Due in 5 days</p>
                    </div>
                    <span className="px-2.5 py-1 text-[10px] font-semibold tracking-wide rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">SENT</span>
                  </div>
                </div>
              </div>
            </div>
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
