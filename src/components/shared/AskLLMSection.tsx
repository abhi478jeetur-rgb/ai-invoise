'use client'

import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(useGSAP)

export default function AskLLMSection() {
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      // Gentle floating animation for LLM buttons to make the UI feel responsive and alive
      gsap.to('.llm-btn', {
        y: -4,
        duration: 2.2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        stagger: 0.15,
      })
    },
    { scope: containerRef }
  )

  const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>, brandColor: string, id: string) => {
    const target = e.currentTarget
    const icon = target.querySelector('.llm-icon')

    // 1. Premium Button Aura & Border scale
    gsap.to(target, {
      scale: 1.05,
      borderColor: brandColor,
      boxShadow: `0 0 25px ${brandColor}33`,
      duration: 0.4,
      ease: 'power2.out',
    })

    // 2. Individual Outstanding Logo Animations
    if (icon) {
      if (id === 'chatgpt') {
        // Smooth 180 deg rotation
        gsap.to(icon, {
          rotation: '+=180',
          duration: 0.6,
          ease: 'power2.out',
        })
      } else if (id === 'claude') {
        // Playful vertical springy bounce
        gsap.to(icon, {
          y: -5,
          duration: 0.2,
          yoyo: true,
          repeat: 1,
          ease: 'power1.out',
        })
      } else if (id === 'perplexity') {
        // Expanding pulse scale effect
        gsap.to(icon, {
          scale: 1.25,
          duration: 0.2,
          yoyo: true,
          repeat: 1,
          ease: 'power2.out',
        })
      } else if (id === 'gemini') {
        // Radiant rotation and springy scale expand
        gsap.to(icon, {
          rotation: '+=360',
          scale: 1.25,
          duration: 0.8,
          ease: 'back.out(1.6)',
        })
      }
    }
  }

  const handleMouseLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const target = e.currentTarget
    const icon = target.querySelector('.llm-icon')

    // Reset button style
    gsap.to(target, {
      scale: 1,
      borderColor: 'rgba(38, 38, 38, 0.8)',
      boxShadow: 'none',
      duration: 0.4,
      ease: 'power2.out',
    })

    // Reset icon style
    if (icon) {
      gsap.to(icon, {
        rotation: 0,
        scale: 1,
        y: 0,
        duration: 0.4,
        ease: 'power2.out',
      })
    }
  }

  const llms = [
    {
      id: 'chatgpt',
      name: 'Ask ChatGPT',
      color: '#10b981', // Emerald green
      url: 'https://chatgpt.com',
      iconSrc: '/chatgpt.svg',
    },
    {
      id: 'claude',
      name: 'Ask Claude',
      color: '#f97316', // Orange
      url: 'https://claude.ai',
      iconSrc: '/claude.svg',
    },
    {
      id: 'perplexity',
      name: 'Ask Perplexity',
      color: '#06b6d4', // Cyan
      url: 'https://perplexity.ai',
      iconSrc: '/perplexity.svg',
    },
    {
      id: 'gemini',
      name: 'Ask Gemini',
      color: '#6366f1', // Indigo
      url: 'https://gemini.google.com',
      iconSrc: '/gemeni.svg', // Exact matching filename in public directory
    },
  ]

  return (
    <div ref={containerRef} className="w-full max-w-4xl mx-auto py-16 px-4 text-center border-t border-neutral-900/60 relative overflow-hidden">
      {/* Dynamic ambient backdrop glowing filter */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-40 bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

      <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-100 mb-3 relative z-10">
        Still wondering if ChaseFree is right for you?
      </h3>
      <p className="text-xs sm:text-sm text-neutral-500 max-w-xl mx-auto mb-10 relative z-10 leading-relaxed">
        Check out what your favorite LLM has to say about us, then make an informed decision.
      </p>

      {/* Grid of Interactive Buttons with real SVGs */}
      <div className="flex flex-wrap items-center justify-center gap-3.5 relative z-10">
        {llms.map((llm) => (
          <a
            key={llm.id}
            href={llm.url}
            target="_blank"
            rel="noopener noreferrer"
            onMouseEnter={(e) => handleMouseEnter(e, llm.color, llm.id)}
            onMouseLeave={handleMouseLeave}
            className="llm-btn flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-neutral-900 bg-neutral-950/60 backdrop-blur-md text-xs font-semibold text-neutral-300 hover:text-white transition-colors duration-300 shadow-md cursor-pointer select-none"
          >
            <img
              src={llm.iconSrc}
              alt={llm.name}
              className="w-4 h-4 object-contain llm-icon shrink-0"
            />
            <span>{llm.name}</span>
          </a>
        ))}
      </div>
    </div>
  )
}
