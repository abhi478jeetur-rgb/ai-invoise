'use client'

import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { MessageSquare, Sparkles } from 'lucide-react'

gsap.registerPlugin(useGSAP)

export default function AskLLMSection() {
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      // Gentle floating animation for LLM buttons
      gsap.to('.llm-btn', {
        y: -4,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        stagger: 0.15,
      })
    },
    { scope: containerRef }
  )

  const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>, brandColor: string) => {
    const target = e.currentTarget
    gsap.to(target, {
      scale: 1.05,
      borderColor: brandColor,
      boxShadow: `0 0 25px ${brandColor}33`,
      duration: 0.4,
      ease: 'power2.out',
    })
  }

  const handleMouseLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const target = e.currentTarget
    gsap.to(target, {
      scale: 1,
      borderColor: 'rgba(38, 38, 38, 0.8)',
      boxShadow: 'none',
      duration: 0.4,
      ease: 'power2.out',
    })
  }

  const llms = [
    {
      name: 'Ask ChatGPT',
      color: '#10b981', // Emerald green
      url: 'https://chatgpt.com',
      icon: (
        <svg className="w-4 h-4 text-emerald-400 object-contain" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21.74 12.06c.07-.37.11-.75.11-1.14 0-1.66-.67-3.22-1.89-4.32.22-.64.33-1.3.33-1.97 0-3.31-2.69-6-6-6-.67 0-1.33.11-1.97.33C11.22.67 9.66 0 8 0 4.69 0 2 2.69 2 6c0 .39.04.77.11 1.14C.89 8.24.22 9.8.22 11.46c0 .67.11 1.33.33 1.97C.33 14.07.22 14.73.22 15.4c0 3.31 2.69 6 6 6 .67 0 1.33-.11 1.97-.33 1.1.55 2.66 1.22 4.32 1.22 3.31 0 6-2.69 6-6 0-.39-.04-.77-.11-1.14 1.22-1.1 1.89-2.66 1.89-4.32 0-.67-.11-1.33-.33-1.97.22-.64.33-1.3.33-1.97 0-.39-.04-.77-.11-1.14z" opacity="0.15" />
          <path d="M20.5 12.06c.07-.37.11-.75.11-1.14 0-1.66-.67-3.22-1.89-4.32.22-.64.33-1.3.33-1.97 0-3.31-2.69-6-6-6-.67 0-1.33.11-1.97.33C10.22.67 8.66 0 7 0 3.69 0 1 2.69 1 6c0 .39.04.77.11 1.14C.09 8.24-.58 9.8-.58 11.46c0 .67.11 1.33.33 1.97-.22.64-.33 1.3-.33 1.97 0 3.31 2.69 6 6 6 .67 0 1.33-.11 1.97-.33 1.1.55 2.66 1.22 4.32 1.22 3.31 0 6-2.69 6-6 0-.39-.04-.77-.11-1.14 1.22-1.1 1.89-2.66 1.89-4.32 0-.67-.11-1.33-.33-1.97.22-.64.33-1.3.33-1.97z M12.5 20.32c-.52-.08-1.04-.26-1.5-.54.34-.33.82-.54 1.34-.54h1.66v1.08z" />
        </svg>
      ),
    },
    {
      name: 'Ask Claude',
      color: '#f97316', // Orange
      url: 'https://claude.ai',
      icon: (
        <svg className="w-4 h-4 text-orange-400 object-contain" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.5h-2v-2h2v2zm0-3.5h-2V7h2v6z" />
        </svg>
      ),
    },
    {
      name: 'Ask Perplexity',
      color: '#06b6d4', // Cyan
      url: 'https://perplexity.ai',
      icon: (
        <svg className="w-4 h-4 text-cyan-400 object-contain" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 1.93-.68 3.7-1.8 5.1z" />
        </svg>
      ),
    },
    {
      name: 'Ask Gemini',
      color: '#6366f1', // Indigo
      url: 'https://gemini.google.com',
      icon: (
        <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
      ),
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

      {/* Grid of Interactive Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3.5 relative z-10">
        {llms.map((llm, idx) => (
          <a
            key={idx}
            href={llm.url}
            target="_blank"
            rel="noopener noreferrer"
            onMouseEnter={(e) => handleMouseEnter(e, llm.color)}
            onMouseLeave={handleMouseLeave}
            className="llm-btn flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-neutral-900 bg-neutral-950/60 backdrop-blur-md text-xs font-semibold text-neutral-300 hover:text-white transition-colors duration-300 shadow-md cursor-pointer select-none"
          >
            {llm.icon}
            <span>{llm.name}</span>
          </a>
        ))}
      </div>
    </div>
  )
}
