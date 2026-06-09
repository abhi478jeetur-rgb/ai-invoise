'use client'

import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(useGSAP)

export default function AnimatedHeroBackground() {
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      // 1. Gently animate the constellation nodes (floating effect)
      gsap.to('.hero-node', {
        x: 'random(-15, 15)',
        y: 'random(-15, 15)',
        duration: 'random(4, 7)',
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        stagger: 0.2,
      })

      // 2. Pulse the gradient glowing filters
      gsap.to('.hero-glow-pulse', {
        opacity: 'random(0.3, 0.6)',
        scale: 'random(0.9, 1.1)',
        duration: 'random(3, 5)',
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        stagger: 0.5,
      })

      // 3. Draw the background abstract constellation lines
      gsap.fromTo(
        '.hero-constellation-line',
        { strokeDashoffset: 400, strokeDasharray: 400 },
        {
          strokeDashoffset: 0,
          duration: 4,
          repeat: -1,
          yoyo: true,
          ease: 'power1.inOut',
        }
      )
    },
    { scope: containerRef }
  )

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden select-none z-0"
    >
      {/* Background glowing gradients */}
      <div className="absolute top-12 left-1/4 w-[500px] h-[300px] bg-purple-500/10 rounded-full blur-[130px] hero-glow-pulse opacity-40" />
      <div className="absolute top-36 right-1/4 w-[400px] h-[250px] bg-emerald-500/10 rounded-full blur-[130px] hero-glow-pulse opacity-30" />

      {/* SVG Constellations */}
      <svg className="absolute w-full h-full opacity-35" viewBox="0 0 1440 600" fill="none">
        {/* Constellation Lines */}
        <path
          className="hero-constellation-line"
          d="M 150 150 L 300 280 L 450 100 L 700 200 L 950 120 L 1150 280 M 300 280 L 700 200 M 450 100 L 950 120"
          stroke="url(#constellation-grad)"
          strokeWidth="1.5"
          strokeDasharray="6 4"
        />

        {/* Constellation Nodes */}
        <circle className="hero-node blur-[0.5px]" cx="150" cy="150" r="4" fill="#a855f7" />
        <circle className="hero-node" cx="300" cy="280" r="6" fill="#8b5cf6" />
        <circle className="hero-node" cx="450" cy="100" r="5" fill="#ec4899" />
        <circle className="hero-node" cx="700" cy="200" r="7" fill="#a855f7" />
        <circle className="hero-node" cx="950" cy="120" r="4" fill="#10b981" />
        <circle className="hero-node" cx="1150" cy="280" r="5" fill="#3b82f6" />

        {/* Definitions */}
        <defs>
          <linearGradient id="constellation-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#ec4899" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.4" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}
