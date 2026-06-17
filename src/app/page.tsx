import { createClient } from '@/lib/db/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import AnimatedPreview from '@/components/shared/AnimatedPreview'
import AnimatedHeaderLogo from '@/components/shared/AnimatedHeaderLogo'
import AnimatedHeroBackground from '@/components/shared/AnimatedHeroBackground'
import AnimatedFooterCta from '@/components/shared/AnimatedFooterCta'
import AskLLMSection from '@/components/shared/AskLLMSection'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ChaseFree AI - Focus on Late Invoices',
  description: 'ChaseFree AI automatically monitors late invoices and sends smart, polite follow-up reminders to get you paid faster without awkward conversations.',
}

import {
  Shield,
  Copy,
  Clock,
  FileText,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Zap,
  Ban,
  RefreshCw,
  HeartHandshake,
  Landmark,
  TrendingUp,
  AlertCircle,
  Sparkles,
  Milestone,
  ArrowUpRight,
  TrendingDown,
  Lock,
  Star
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
              <a href="#pain-points" className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors">
                Why Chasing Hurts
              </a>
              <a href="#how-it-works" className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors">
                How It Works
              </a>
              <a href="#pricing" className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors">
                Pricing
              </a>
              <a href="#roadmap" className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors">
                Roadmap
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
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(16,185,129,0.08),transparent)] pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-neutral-800/10 rounded-full blur-[120px] pointer-events-none" />
        <AnimatedHeroBackground />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-12 sm:pt-10 sm:pb-16">
          <div className="text-center max-w-3xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-neutral-900 bg-neutral-900/60 text-[11px] text-neutral-400 mb-6 backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Built for freelancers who hate chasing payments
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] bg-gradient-to-b from-white via-neutral-100 to-neutral-500 bg-clip-text text-transparent">
              Chasing Late Payments is Awkward.<br className="hidden sm:inline" /> Let AI Do It Safely.
            </h1>

            {/* Subheadline */}
            <p className="mt-5 text-base sm:text-lg text-neutral-400 leading-relaxed max-w-2xl mx-auto font-light">
              ChaseFree AI is a relationship-safe invoicing assistant. Track unpaid bills and generate perfect-tone reminder emails with a single click. Keep your cash flowing, keep your relationships perfect.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mt-8 px-4 sm:px-0">
              <Link href={ctaHref} className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto h-10 px-6 bg-white text-black hover:bg-neutral-200 font-medium text-sm cursor-pointer shadow-lg shadow-white/5">
                  {ctaLabel}
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
              <a href="#how-it-works" className="w-full sm:w-auto">
                <Button variant="ghost" className="w-full sm:w-auto h-10 px-6 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 font-medium text-sm cursor-pointer">
                  See How it Works
                </Button>
              </a>
            </div>
          </div>

          {/* Dashboard Mockup Preview */}
          <AnimatedPreview />
        </div>
      </section>

      {/* Stats Bar Section */}
      <section className="border-t border-b border-neutral-900 bg-neutral-950/40 py-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(16,185,129,0.02),transparent)] pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center items-center">
            <div className="space-y-1">
              <p className="text-3xl font-bold text-white tracking-tight">20%</p>
              <p className="text-xs text-neutral-500 font-light max-w-xs mx-auto">
                Average freelancer income written off due to uncollected invoices
              </p>
            </div>
            <div className="hidden md:block w-px h-12 bg-neutral-900 mx-auto" />
            <div className="space-y-1">
              <p className="text-3xl font-bold text-white tracking-tight">21 Days</p>
              <p className="text-xs text-neutral-500 font-light max-w-xs mx-auto">
                Average payment delay small businesses face past the due date
              </p>
            </div>
            <div className="hidden md:block w-px h-12 bg-neutral-900 mx-auto" />
            <div className="space-y-1">
              <p className="text-3xl font-bold text-emerald-400 tracking-tight">3x Faster</p>
              <p className="text-xs text-neutral-500 font-light max-w-xs mx-auto">
                Average collection speed using automated, relationship-safe reminders
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points Section */}
      <section id="pain-points" className="py-20 sm:py-24 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-xs text-emerald-500 font-medium uppercase tracking-wider mb-2">The Freelancer Dilemma</p>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-100">
              But... chasing invoices manually is painful
            </h2>
            <p className="mt-4 text-sm text-neutral-500 leading-relaxed font-light">
              Without a system, following up with late paying clients is either ignored or ends up destroying valuable relationships.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-neutral-900 bg-neutral-900/20 backdrop-blur-xl hover:bg-neutral-900/40 transition-all duration-300">
              <CardContent className="p-6 space-y-4">
                <div className="w-10 h-10 rounded-lg bg-red-950/20 border border-red-900/30 flex items-center justify-center">
                  <Ban className="w-5 h-5 text-red-400" />
                </div>
                <h3 className="text-sm font-semibold text-neutral-200">Ruined Client Relations</h3>
                <p className="text-xs text-neutral-500 leading-relaxed font-light">
                  Send a reminder too harsh, and you lose the client. Send it too soft, and they continue to ignore it. Finding that sweet spot is exhausting.
                </p>
              </CardContent>
            </Card>

            <Card className="border-neutral-900 bg-neutral-900/20 backdrop-blur-xl hover:bg-neutral-900/40 transition-all duration-300">
              <CardContent className="p-6 space-y-4">
                <div className="w-10 h-10 rounded-lg bg-yellow-950/20 border border-yellow-900/30 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-400" />
                </div>
                <h3 className="text-sm font-semibold text-neutral-200">Wasted Admin Hours</h3>
                <p className="text-xs text-neutral-500 leading-relaxed font-light">
                  Manually tracking payment dates on spreadsheets, matching calendars, and drafting personalized nudge emails eats up hours of your weekend.
                </p>
              </CardContent>
            </Card>

            <Card className="border-neutral-900 bg-neutral-900/20 backdrop-blur-xl hover:bg-neutral-900/40 transition-all duration-300">
              <CardContent className="p-6 space-y-4">
                <div className="w-10 h-10 rounded-lg bg-blue-950/20 border border-blue-900/30 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-sm font-semibold text-neutral-200">Constant Tone Anxiety</h3>
                <p className="text-xs text-neutral-500 leading-relaxed font-light">
                  Sitting down to write a late payment notice causes procrastination. Nobody likes asking for money, leading to write-offs and delayed cash flows.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 sm:py-24 border-t border-neutral-900 bg-neutral-950/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <p className="text-xs text-emerald-500 font-medium uppercase tracking-wider mb-2">Zero Friction</p>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-100">
              Get paid on time in 3 simple steps
            </h2>
            <p className="mt-4 text-sm text-neutral-500 leading-relaxed font-light">
              We remove the awkward conversations and give you a structured, calm way to handle outstanding payments.
            </p>
          </div>

          <div className="grid gap-12 lg:grid-cols-3 relative">
            {/* Step 1 */}
            <div className="space-y-4 relative">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-xs font-bold text-neutral-300">
                  1
                </div>
                <h3 className="text-base font-semibold text-neutral-200">Create with Smart Builder</h3>
              </div>
              <p className="text-xs text-neutral-500 leading-relaxed font-light">
                Draft professional invoices with dynamic line items, multi-currency settings, flat or percentage discounts, and structured taxes. View the live PDF rendering side-by-side as you type.
              </p>
            </div>

            {/* Step 2 */}
            <div className="space-y-4 relative">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-xs font-bold text-neutral-300">
                  2
                </div>
                <h3 className="text-base font-semibold text-neutral-200">Spot Overdue Invoices</h3>
              </div>
              <p className="text-xs text-neutral-500 leading-relaxed font-light">
                Wake up to a calm morning list. The &ldquo;Who to Chase Today&rdquo; panel highlights exactly which clients are overdue, how long they&apos;ve been late, and the total value pending. No guesswork.
              </p>
            </div>

            {/* Step 3 */}
            <div className="space-y-4 relative">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-xs font-bold text-neutral-300">
                  3
                </div>
                <h3 className="text-base font-semibold text-neutral-200">Generate Safe AI Reminders</h3>
              </div>
              <p className="text-xs text-neutral-500 leading-relaxed font-light">
                Click &ldquo;Generate Reminder&rdquo; and choose from Friendly, Professional, Firm, or Final Notice presets. The AI drafts a context-aware email instantly for you to review and copy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section id="features" className="py-20 sm:py-24 border-t border-neutral-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">Designed for Solopreneurs</p>
            <h2 className="text-3xl font-semibold tracking-tight text-neutral-100">
              Powerful tools, built with zero accounting bloat
            </h2>
            <p className="mt-3 text-sm text-neutral-500 font-light">
              We focus strictly on securing your payments while respecting your clients.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Shield,
                title: 'Relationship-Safe AI Tones',
                description:
                  'Select from Friendly Nudge, Professional, Firm, or Final Notice tones. Perfect tone escalation protects your payments and client relationships.',
              },
              {
                icon: FileText,
                title: 'Smart PDF Builder',
                description:
                  'A clean two-pane invoice layout supporting custom line items, currency codes, percentage or flat discounts, and multi-state tax setups.',
              },
              {
                icon: Lock,
                title: 'Secure API Vault',
                description:
                  'Keep your AI API keys safe with AES-256-CBC cryptographic encryption. Your keys are secure and never visible to unauthorized parties.',
              },
              {
                icon: Clock,
                title: 'Audit Event Logs',
                description:
                  'Track every draft created, clipboard copy action, and status update chronologically in a clear audit timeline for every invoice.',
              },
              {
                icon: Copy,
                title: 'Unbilled Scratchpad',
                description:
                  'Log billing items dynamically as you work, then batch-convert them into an invoice instantly when you are ready to bill.',
              },
              {
                icon: CheckCircle2,
                title: 'Multi-Currency Status Cards',
                description:
                  'Display outstanding and overdue invoices separately under different currencies (e.g. ₹ and $) without confusing conversions.',
              },
            ].map((feature, idx) => (
              <Card
                key={idx}
                className="border-neutral-900 bg-neutral-900/30 backdrop-blur-xl hover:bg-neutral-900/50 transition-colors"
              >
                <CardContent className="p-5 space-y-3">
                  <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-neutral-800/60 border border-neutral-700/50">
                    <feature.icon className="w-4 h-4 text-neutral-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-neutral-200">{feature.title}</h3>
                  <p className="text-xs text-neutral-500 leading-relaxed font-light">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Tiers Section */}
      <section id="pricing" className="py-20 sm:py-24 border-t border-neutral-900 bg-neutral-950/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-xs text-emerald-500 font-medium uppercase tracking-wider mb-2">Monetization</p>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-100">
              Simple, transparent billing
            </h2>
            <p className="mt-4 text-sm text-neutral-500 leading-relaxed font-light">
              No contracts. Pause or cancel anytime. Local currency PPP discount automatically applied at checkout.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
            {/* Free Plan */}
            <Card className="border-neutral-900 bg-neutral-900/20 backdrop-blur-xl flex flex-col justify-between">
              <CardContent className="p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">Hobby Plan</h3>
                  <p className="mt-2 text-3xl font-bold text-white">$0</p>
                  <p className="text-[10px] text-neutral-500 mt-1">Free forever</p>
                </div>
                <ul className="space-y-2.5 text-xs text-neutral-400 font-light">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-neutral-500" />
                    <span>5 AI credits per month</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Smart PDF Invoice Builder</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Email & Dashboard Watermark</span>
                  </li>
                </ul>
              </CardContent>
              <div className="p-6 pt-0">
                <Link href="/sign-up" className="w-full">
                  <Button variant="ghost" className="w-full text-xs hover:bg-neutral-900 border border-neutral-800 text-neutral-300">
                    Get Started
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Pro Plan */}
            <Card className="border-emerald-900/60 bg-emerald-950/5 backdrop-blur-xl flex flex-col justify-between relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-emerald-500 text-neutral-950 text-[9px] font-bold tracking-wider uppercase">
                Most Popular
              </div>
              <CardContent className="p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">Pro Freelancer</h3>
                  <p className="mt-2 text-3xl font-bold text-white">$9<span className="text-xs text-neutral-500 font-light">/mo</span></p>
                  <p className="text-[10px] text-emerald-500 mt-1">Purchasing Power Parity applied</p>
                </div>
                <ul className="space-y-2.5 text-xs text-neutral-300 font-light">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                    <span>50 AI credits per month</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Remove all watermarks</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Custom branding & logos</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Unbilled Scratchpad & Logs</span>
                  </li>
                </ul>
              </CardContent>
              <div className="p-6 pt-0">
                <Link href="/sign-up" className="w-full">
                  <Button className="w-full text-xs bg-white text-black hover:bg-neutral-200">
                    Go Pro
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Agency Plan */}
            <Card className="border-neutral-900 bg-neutral-900/20 backdrop-blur-xl flex flex-col justify-between">
              <CardContent className="p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">Agency / Team</h3>
                  <p className="mt-2 text-3xl font-bold text-white">$29<span className="text-xs text-neutral-500 font-light">/mo</span></p>
                  <p className="text-[10px] text-neutral-500 mt-1">For growing teams</p>
                </div>
                <ul className="space-y-2.5 text-xs text-neutral-400 font-light">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Unlimited AI drafts</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Up to 3 team seats included</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-neutral-500" />
                    <span>No watermarks & full features</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Priority ticketing support</span>
                  </li>
                </ul>
              </CardContent>
              <div className="p-6 pt-0">
                <Link href="/sign-up" className="w-full">
                  <Button variant="ghost" className="w-full text-xs hover:bg-neutral-900 border border-neutral-800 text-neutral-300">
                    Contact Sales
                  </Button>
                </Link>
              </div>
            </Card>
          </div>

          {/* Top Ups */}
          <div className="mt-8 text-center">
            <p className="text-xs text-neutral-500 font-light">
              Need extra credits? Get <span className="text-neutral-300 font-medium">50 credits for-$5</span> (Pay-As-You-Go). Never expires, rollover supported.
            </p>
          </div>
        </div>
      </section>

      {/* Future Roadmap Section */}
      <section id="roadmap" className="py-20 sm:py-24 border-t border-neutral-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">Roadmap</p>
            <h2 className="text-3xl font-semibold tracking-tight text-neutral-100">
              Future Roadmap & Active Planning
            </h2>
            <p className="mt-3 text-sm text-neutral-500 font-light">
              What we are building next to optimize your payment pipeline.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
            <div className="p-5 rounded-lg border border-neutral-900 bg-neutral-900/10 space-y-2">
              <div className="flex items-center gap-2">
                <Milestone className="w-4 h-4 text-purple-400 shrink-0" />
                <h4 className="text-xs font-semibold text-neutral-200">Bank & Gateway Feeds</h4>
              </div>
              <p className="text-[11px] text-neutral-500 font-light leading-relaxed">
                Connect Lemon Squeezy, Paddle, or custom bank connections to automatically mark outstanding invoices as paid the moment client transactions clear.
              </p>
            </div>

            <div className="p-5 rounded-lg border border-neutral-900 bg-neutral-900/10 space-y-2">
              <div className="flex items-center gap-2">
                <Milestone className="w-4 h-4 text-emerald-400 shrink-0" />
                <h4 className="text-xs font-semibold text-neutral-200">AI Reply & Sentiment Analysis</h4>
              </div>
              <p className="text-[11px] text-neutral-500 font-light leading-relaxed">
                Analyze client responses automatically to detect payment promises, reasons for delay, and dynamically adjust reminder frequency and escalation tones.
              </p>
            </div>

            <div className="p-5 rounded-lg border border-neutral-900 bg-neutral-900/10 space-y-2">
              <div className="flex items-center gap-2">
                <Milestone className="w-4 h-4 text-blue-400 shrink-0" />
                <h4 className="text-xs font-semibold text-neutral-200">Sequential Compliance Auditing</h4>
              </div>
              <p className="text-[11px] text-neutral-500 font-light leading-relaxed">
                Enforce sequential numbering rules automatically during invoice generation to guarantee tax compliance and simplify accounting audits.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="border-t border-neutral-900 py-20 sm:py-24 bg-neutral-950/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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
                className="border-neutral-900 bg-neutral-900/30 backdrop-blur-xl"
              >
                <CardContent className="p-5">
                  <p className="text-xs text-neutral-400 leading-relaxed mb-4 font-light">
                    &ldquo;{testimonial.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center">
                      <span className="text-[10px] font-medium text-neutral-400">
                        {testimonial.name[0]}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-neutral-300">{testimonial.name}</p>
                      <p className="text-[10px] text-neutral-500 font-light">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-neutral-900 py-20 px-4 sm:px-6 lg:px-8">
        <AnimatedFooterCta>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-100">
            Ready to stop chasing?
          </h2>
          <p className="mt-3 text-sm text-neutral-500 max-w-md mx-auto font-light">
            Join thousands of freelancers who collect faster with less stress. Free to start, no credit card required.
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
      <footer className="border-t border-neutral-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <AnimatedHeaderLogo />
            <p className="text-[11px] text-neutral-600 font-light">
              &copy; {new Date().getFullYear()} ChaseFree AI. Built for freelancers who deserve to get paid.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

