'use client'

import { useRef, useEffect, useState } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(useGSAP)

export default function AnimatedFooterCta({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const borderPathRef = useRef<SVGPathElement>(null)
  const [hasEntered, setHasEntered] = useState(false)

  // Use IntersectionObserver to trigger animation dynamically on viewport entry
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasEntered(true)
          observer.disconnect() // trigger only once for bulletproof stability
        }
      },
      { threshold: 0.25 }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [])

  useGSAP(
    () => {
      if (!hasEntered) return

      const tl = gsap.timeline()

      // 1. Reveal container with soft slide up & premium scaling
      tl.fromTo(
        containerRef.current,
        { y: 40, opacity: 0, scale: 0.98 },
        { y: 0, opacity: 1, scale: 1, duration: 1.2, ease: 'power3.out' }
      )

      // 2. Draw the glowing borders frame
      if (borderPathRef.current) {
        tl.fromTo(
          borderPathRef.current,
          { strokeDashoffset: 1600, strokeDasharray: 1600 },
          { strokeDashoffset: 0, duration: 2.2, ease: 'power2.inOut' },
          '-=0.8'
        )
      }

      // 3. Pulsing dynamic glassmorphic ambient glow inside background
      gsap.to('.cta-ambient-glow', {
        opacity: 0.8,
        scale: 1.06,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })
    },
    { dependencies: [hasEntered], scope: containerRef }
  )

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-4xl mx-auto rounded-2xl border border-neutral-900 bg-neutral-900/10 backdrop-blur-xl p-8 sm:p-12 text-center overflow-hidden group opacity-0"
    >
      {/* Dynamic draw SVG border absolute overlay */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-20 rounded-2xl"
        viewBox="0 0 800 300"
        preserveAspectRatio="none"
        fill="none"
      >
        <path
          ref={borderPathRef}
          d="M 2 2 L 798 2 L 798 298 L 2 298 Z"
          stroke="url(#cta-border-gradient)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="cta-border-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#ec4899" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
          </linearGradient>
        </defs>
      </svg>

      {/* Decorative ambient glowing backdrops */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-tr from-purple-500/10 to-emerald-500/10 rounded-full blur-[80px] cta-ambient-glow pointer-events-none" />

      {/* Render wrapped original CTA children (Server Components!) inside fully client-animated frame */}
      <div className="relative z-10">{children}</div>
    </div>
  )
}
