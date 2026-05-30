'use client'

import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import Link from 'next/link'

gsap.registerPlugin(useGSAP)

export default function AnimatedHeaderLogo() {
  const logoRef = useRef<HTMLImageElement>(null)

  const { contextSafe } = useGSAP({ scope: logoRef })

  // Elastic 360-degree rotation spin on cursor enter
  const handleMouseEnter = contextSafe(() => {
    gsap.to(logoRef.current, {
      rotation: '+=360',
      duration: 1.2,
      ease: 'back.out(1.5)',
      overwrite: 'auto',
    })
  })

  return (
    <Link href="/" className="flex items-center gap-2.5 group select-none">
      <div className="relative w-8 h-8 rounded-lg bg-neutral-900/60 border border-neutral-800/80 flex items-center justify-center overflow-hidden">
        {/* Glow ambient circle inside background */}
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={logoRef}
          src="/logo.svg"
          alt="ChaseFree AI Logo"
          className="w-5 h-5 object-contain relative z-10"
          onMouseEnter={handleMouseEnter}
        />
      </div>
      <span className="text-sm font-semibold text-neutral-200 tracking-tight transition-colors duration-300 group-hover:text-white">
        ChaseFree AI
      </span>
    </Link>
  )
}
