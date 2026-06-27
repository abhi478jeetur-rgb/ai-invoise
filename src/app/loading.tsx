'use client'

import React from 'react'

export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-neutral-950 text-emerald-500 z-[9999]">
      <div className="flex flex-col items-center gap-6">
        {/* DNA Helix Container */}
        <div className="flex items-center gap-1.5 h-16">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="relative flex flex-col justify-between items-center w-1.5 h-16"
              style={{
                // Stagger each column's delay
                animationDelay: `${i * 0.15}s`,
              }}
            >
              {/* Connecting line */}
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-emerald-500/10 animate-dna-line"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
              {/* Dot A (emerald) */}
              <div 
                className="w-1.5 h-1.5 rounded-full bg-emerald-500 absolute animate-dna-dot-a"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
              {/* Dot B (cyan) */}
              <div 
                className="w-1.5 h-1.5 rounded-full bg-cyan-400 absolute animate-dna-dot-b"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            </div>
          ))}
        </div>
        <p className="text-xs font-semibold tracking-[0.2em] text-emerald-500/70 animate-pulse uppercase">
          Loading ChaseFree AI...
        </p>
      </div>
    </div>
  )
}
