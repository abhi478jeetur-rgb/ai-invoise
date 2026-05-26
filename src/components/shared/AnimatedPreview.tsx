'use client'

import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { CheckCircle2, AlertCircle, TrendingUp, Sparkles } from 'lucide-react'

// Register the React plugin for GSAP (helps with automatic scope binding & cleanup)
gsap.registerPlugin(useGSAP)

export default function AnimatedPreview() {
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      // 1. Draw the connection path representing the smooth invoice flow
      gsap.fromTo(
        '#flow-path-main',
        { strokeDashoffset: 1000, strokeDasharray: 1000 },
        {
          strokeDashoffset: 0,
          duration: 3,
          repeat: -1,
          ease: 'power1.inOut',
          yoyo: false,
        }
      )

      // 2. Animate floating glowing relationship sparkles (AI nodes) along the flow
      gsap.to('.ai-sparkle', {
        y: '-=12',
        x: '+=8',
        opacity: 0.8,
        stagger: {
          each: 0.4,
          repeat: -1,
          yoyo: true,
        },
        duration: 2.5,
        ease: 'sine.inOut',
      })

      // 3. Outstanding / Overdue / Paid card entrance and subtle continuous glow pulses
      const tl = gsap.timeline()
      tl.from('.stat-card-anim', {
        y: 30,
        opacity: 0,
        stagger: 0.15,
        duration: 0.8,
        ease: 'back.out(1.2)',
      })

      // Overdue badge glowing pulse
      gsap.to('#overdue-badge-glow', {
        opacity: 0.7,
        scale: 1.05,
        duration: 1.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })

      // Status indicator line drawing
      gsap.fromTo(
        '.draw-progress-line',
        { scaleX: 0 },
        {
          scaleX: 1,
          transformOrigin: 'left center',
          duration: 1.2,
          stagger: 0.2,
          ease: 'power2.out',
        }
      )
    },
    { scope: containerRef } // Scoping avoids collision and enables automatic cleanups on unmount
  )

  return (
    <div ref={containerRef} className="w-full max-w-3xl mx-auto mt-14">
      <div className="rounded-xl border border-neutral-800/80 bg-neutral-950/40 backdrop-blur-xl p-4 sm:p-6 shadow-2xl shadow-black/50 overflow-hidden relative group">
        {/* Decorative dynamic ambient glow */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none transition-transform duration-1000 group-hover:scale-125" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none transition-transform duration-1000 group-hover:scale-125" />

        {/* Mock window control bar */}
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-neutral-900/60">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-neutral-800/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-neutral-800/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-neutral-800/80" />
            <span className="text-[10px] text-neutral-600 font-mono ml-2">chasefree-ai-dashboard</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-neutral-500 font-medium px-2 py-0.5 rounded border border-neutral-900/80 bg-neutral-950/30">
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span>AI Assistant Active</span>
          </div>
        </div>

        {/* Dynamic Metric Cards (Interactive HSL Custom Palettes) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {/* Outstanding Card */}
          <div className="stat-card-anim relative rounded-lg border border-neutral-900/80 bg-neutral-900/30 backdrop-blur-md p-4 transition-all duration-300 hover:border-neutral-800/80">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] text-neutral-500 font-medium uppercase tracking-wider">Outstanding</span>
              <TrendingUp className="w-4 h-4 text-neutral-400" />
            </div>
            <h4 className="text-xl font-bold text-neutral-100">$12,400</h4>
            <div className="w-full bg-neutral-950 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="draw-progress-line h-full bg-neutral-600 rounded-full w-[65%]" />
            </div>
            <p className="text-[9px] text-neutral-500 mt-2">7 client invoices pending approval</p>
          </div>

          {/* Overdue Card */}
          <div className="stat-card-anim relative rounded-lg border border-red-950/30 bg-red-950/5 p-4 transition-all duration-300 hover:border-red-900/30">
            {/* Ambient indicator */}
            <div id="overdue-badge-glow" className="absolute top-3 right-3 w-2 h-2 rounded-full bg-red-500 opacity-40 blur-[1px]" />
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] text-red-400/80 font-medium uppercase tracking-wider">Overdue</span>
              <AlertCircle className="w-4 h-4 text-red-400" />
            </div>
            <h4 className="text-xl font-bold text-red-400">$4,500</h4>
            <div className="w-full bg-neutral-950 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="draw-progress-line h-full bg-red-500/80 rounded-full w-[35%]" />
            </div>
            <p className="text-[9px] text-red-400/60 mt-2">2 invoices require chasing</p>
          </div>

          {/* Paid Card */}
          <div className="stat-card-anim relative rounded-lg border border-emerald-950/30 bg-emerald-950/5 p-4 transition-all duration-300 hover:border-emerald-900/30">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] text-emerald-400/80 font-medium uppercase tracking-wider">Collected</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <h4 className="text-xl font-bold text-emerald-400">$28,900</h4>
            <div className="w-full bg-neutral-950 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="draw-progress-line h-full bg-emerald-500/80 rounded-full w-[85%]" />
            </div>
            <p className="text-[9px] text-emerald-400/60 mt-2">14 invoices fully paid</p>
          </div>
        </div>

        {/* Beautiful SVG Interactive Relationship Flow */}
        <div className="relative rounded-lg border border-neutral-900/80 bg-neutral-900/20 p-5 mb-4">
          <p className="text-[10px] text-neutral-500 mb-3 font-semibold uppercase tracking-wider">Automatic AI Relationship Protection Flow</p>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative">
            {/* Client Node */}
            <div className="flex flex-col items-center z-10 w-24">
              <div className="w-12 h-12 rounded-full border border-red-500/30 bg-red-950/20 flex items-center justify-center shadow-lg shadow-red-950/20">
                <span className="text-xs font-semibold text-red-400">Client</span>
              </div>
              <span className="text-[9px] text-neutral-500 mt-2 text-center">Late invoice #42</span>
            </div>

            {/* GSAP SVG Connection Flow Path */}
            <div className="absolute inset-0 hidden sm:flex items-center justify-center pointer-events-none">
              <svg className="w-full h-16" viewBox="0 0 400 64" fill="none">
                <path
                  id="flow-path-main"
                  d="M 60 32 Q 200 -10, 340 32"
                  stroke="url(#flow-gradient)"
                  strokeWidth="2"
                  strokeDasharray="8 6"
                  fill="none"
                />
                <defs>
                  <linearGradient id="flow-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
                    <stop offset="50%" stopColor="#a855f7" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Float Particles / Sparkles in-between */}
            <div className="absolute left-[35%] top-[10%] pointer-events-none ai-sparkle opacity-30 z-20">
              <Sparkles className="w-3.5 h-3.5 text-purple-400 blur-[0.5px]" />
            </div>
            <div className="absolute left-[50%] top-[45%] pointer-events-none ai-sparkle opacity-20 z-20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 blur-[0.5px]" />
            </div>
            <div className="absolute left-[65%] top-[20%] pointer-events-none ai-sparkle opacity-40 z-20">
              <Sparkles className="w-3 h-3 text-indigo-400 blur-[0.5px]" />
            </div>

            {/* Freelancer Node */}
            <div className="flex flex-col items-center z-10 w-24">
              <div className="w-12 h-12 rounded-full border border-emerald-500/30 bg-emerald-950/20 flex items-center justify-center shadow-lg shadow-emerald-950/20">
                <span className="text-xs font-semibold text-emerald-400">You</span>
              </div>
              <span className="text-[9px] text-neutral-500 mt-2 text-center">Safe follow-up</span>
            </div>
          </div>
        </div>

        {/* AI Calibration Modal Preview */}
        <div className="rounded-lg border border-neutral-900/80 bg-neutral-900/30 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Perfect-Tone Reminders</span>
            <div className="flex gap-1.5">
              <span className="px-2 py-0.5 text-[8px] font-medium rounded-full bg-purple-950/50 text-purple-400 border border-purple-900/50">Friendly</span>
              <span className="px-2 py-0.5 text-[8px] font-medium rounded-full bg-neutral-900 text-neutral-500 border border-neutral-800">Firm</span>
              <span className="px-2 py-0.5 text-[8px] font-medium rounded-full bg-neutral-900 text-neutral-500 border border-neutral-800">Final</span>
            </div>
          </div>
          <div className="rounded border border-neutral-900/60 bg-neutral-950/50 p-3 font-mono text-[9px] text-neutral-400 leading-relaxed max-w-full">
            <span className="text-purple-400">Subject:</span> Quick follow-up regarding invoice #INV-0042<br />
            Hi Client, I hope you are having a wonderful week! Just a gentle nudge to see if you have received the outstanding invoice...
          </div>
        </div>
      </div>
    </div>
  )
}
