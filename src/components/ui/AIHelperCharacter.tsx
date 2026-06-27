'use client'

import React, { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'

interface AIHelperCharacterProps {
  variant?: 'invoices' | 'clients' | 'all-clear' | 'activity'
}

export function AIHelperCharacter({ variant = 'invoices' }: AIHelperCharacterProps) {
  const componentContainerRef = useRef<HTMLDivElement>(null)
  const astronautHeadRef = useRef<SVGGElement>(null)
  const astronautVisorRef = useRef<SVGGElement>(null)
  const astronautLeftArmRef = useRef<SVGPathElement>(null)
  const astronautRightArmRef = useRef<SVGPathElement>(null)
  const astronautBodyRef = useRef<SVGGElement>(null)

  const [cursorOffset, setCursorOffset] = useState({ x: 0, y: 0 })
  const [isCursorActive, setIsCursorActive] = useState(false)

  // Initialize anime.js timelines for idle animations
  useEffect(() => {
    if (!astronautBodyRef.current || !astronautLeftArmRef.current || !astronautRightArmRef.current) return

    // Idle floating animation for the body
    const floatingAnimation = gsap.fromTo(astronautBodyRef.current,
      { y: -4, rotation: -1 },
      {
        y: 4,
        rotation: 1,
        duration: 3,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut'
      }
    )

    // Sub-animation for left arm bobbing
    const leftArmBob = gsap.fromTo(astronautLeftArmRef.current,
      { rotation: -3, transformOrigin: '15px 12px' },
      {
        rotation: 3,
        duration: 2.4,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut'
      }
    )

    // Sub-animation for right arm bobbing
    const rightArmBob = gsap.fromTo(astronautRightArmRef.current,
      { rotation: 3, transformOrigin: '65px 12px' },
      {
        rotation: -3,
        duration: 2.6,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut'
      }
    )

    // Random winking/blinking simulation for the eyes
    const eyeBlink = gsap.to('.astronaut-eye', {
      scaleY: 0.1,
      transformOrigin: 'center center',
      duration: 0.15,
      yoyo: true,
      repeat: -1,
      repeatDelay: 4,
      delay: 4,
      ease: 'power1.out'
    })

    return () => {
      floatingAnimation.kill()
      leftArmBob.kill()
      rightArmBob.kill()
      eyeBlink.kill()
    }
  }, [])

  // Listen to container mouse movements to apply cursor-tracking parallax
  useEffect(() => {
    const containerElement = componentContainerRef.current
    if (!containerElement) return

    const trackCursorCoordinates = (event: MouseEvent) => {
      const containerRect = containerElement.getBoundingClientRect()
      const centerX = containerRect.left + containerRect.width / 2
      const centerY = containerRect.top + containerRect.height / 2
      
      // Compute normalized offsets (-1 to 1)
      const relativeX = (event.clientX - centerX) / (containerRect.width / 2)
      const relativeY = (event.clientY - centerY) / (containerRect.height / 2)

      // Clamp offsets to prevent extreme distortion
      setCursorOffset({
        x: Math.max(-1, Math.min(1, relativeX)),
        y: Math.max(-1, Math.min(1, relativeY))
      })
    }

    const activateCursorTracking = () => {
      setIsCursorActive(true)
    }

    const deactivateCursorTracking = () => {
      setIsCursorActive(false)
      
      if (!astronautVisorRef.current || !astronautHeadRef.current) return
      
      // Smoothly transition visor and head back to original center coordinates
      gsap.to([astronautVisorRef.current, astronautHeadRef.current], {
        x: 0,
        y: 0,
        rotation: 0,
        duration: 0.6,
        ease: 'elastic.out(1, 0.6)'
      })
      setCursorOffset({ x: 0, y: 0 })
    }

    containerElement.addEventListener('mousemove', trackCursorCoordinates)
    containerElement.addEventListener('mouseenter', activateCursorTracking)
    containerElement.addEventListener('mouseleave', deactivateCursorTracking)

    return () => {
      containerElement.removeEventListener('mousemove', trackCursorCoordinates)
      containerElement.removeEventListener('mouseenter', activateCursorTracking)
      containerElement.removeEventListener('mouseleave', deactivateCursorTracking)
    }
  }, [])

  // Visor turns more dramatically for 3D parallax illusion
  const visorTranslationX = isCursorActive ? cursorOffset.x * 7 : 0
  const visorTranslationY = isCursorActive ? cursorOffset.y * 5 : 0

  // Head follows cursor slightly
  const headTranslationX = isCursorActive ? cursorOffset.x * 3 : 0
  const headTranslationY = isCursorActive ? cursorOffset.y * 2 : 0
  const headRotationDeg = isCursorActive ? cursorOffset.x * 4 : 0

  return (
    <div 
      ref={componentContainerRef}
      className="relative flex flex-col items-center justify-center w-full max-w-[220px] h-[220px] mx-auto select-none overflow-visible group"
    >
      <style jsx>{`
        @keyframes floatBadge {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-6px) rotate(2deg); }
        }
        .badge-group {
          animation: floatBadge 3.6s ease-in-out infinite;
          transform-origin: center;
        }
      `}</style>

      {/* Glassmorphic Astronaut Display Pod */}
      <div className="w-[160px] h-[160px] flex items-center justify-center overflow-hidden rounded-2xl border border-border/40 bg-card/10 backdrop-blur-md shadow-[0_0_24px_rgba(16,185,129,0.02)] transition-all duration-500 hover:border-primary/20 hover:shadow-[0_0_32px_rgba(16,185,129,0.05)]">
        <svg
          width="120"
          height="120"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="overflow-visible"
        >
          {/* Background Ambient Aura */}
          <circle cx="50" cy="50" r="30" fill="url(#astronaut-aura)" opacity="0.15" />

          {/* Interactive Astronaut Layer */}
          <g ref={astronautBodyRef}>
            {/* Jetpack Pack */}
            <rect x="36" y="44" width="28" height="24" rx="4" fill="#1e293b" stroke="#334155" strokeWidth="1" />
            <circle cx="42" cy="48" r="1.5" fill="#ef4444" />
            <circle cx="58" cy="48" r="1.5" fill="#10b981" />

            {/* Astronaut Body Suit */}
            <path
              d="M32 68 C32 54, 68 54, 68 68 L64 78 L36 78 Z"
              fill="#f1f5f9"
              stroke="#cbd5e1"
              strokeWidth="1.2"
            />
            {/* Premium Gold/Bronze Chest Badge */}
            <rect x="44" y="60" width="12" height="8" rx="1.5" fill="#0f172a" stroke="#475569" strokeWidth="0.8" />
            <line x1="47" y1="64" x2="53" y2="64" stroke="#e2e8f0" strokeWidth="1" />
            <circle cx="50" cy="62" r="0.6" fill="#f59e0b" />

            {/* Floating Left Arm */}
            <path
              ref={astronautLeftArmRef}
              d="M32 58 C26 58, 20 62, 22 68 C23 72, 28 70, 30 65"
              stroke="#cbd5e1"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />

            {/* Floating Right Arm */}
            <path
              ref={astronautRightArmRef}
              d="M68 58 C74 58, 80 62, 78 68 C77 72, 72 70, 70 65"
              stroke="#cbd5e1"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />

            {/* Main Interactive Head & Visor Group */}
            <g 
              ref={astronautHeadRef}
              style={{
                transform: `translate(${headTranslationX}px, ${headTranslationY}px) rotate(${headRotationDeg}deg)`,
                transformOrigin: '50px 38px',
                transition: isCursorActive ? 'none' : 'transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)'
              }}
            >
              {/* Helmet Base */}
              <circle cx="50" cy="36" r="21" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
              <rect x="36" y="53" width="28" height="6" rx="2" fill="#cbd5e1" />

              {/* Visor Area with Cursor-Following Parallax Offset */}
              <g 
                ref={astronautVisorRef}
                style={{
                  transform: `translate(${visorTranslationX}px, ${visorTranslationY}px)`,
                  transition: isCursorActive ? 'none' : 'transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)'
                }}
              >
                {/* Glossy Dark Glass Visor */}
                <path
                  d="M36 36 C36 26, 64 26, 64 36 C64 43, 36 43, 36 36 Z"
                  fill="url(#visor-gradient)"
                  stroke="#1e293b"
                  strokeWidth="1"
                />

                {/* Inside Visor: Twin Glowing AI Eyes */}
                <circle cx="44" cy="34" r="1.8" fill="#10b981" className="astronaut-eye shadow-[0_0_6px_#10b981]" />
                <circle cx="56" cy="34" r="1.8" fill="#10b981" className="astronaut-eye shadow-[0_0_6px_#10b981]" />

                {/* Diagonal Visor Gloss Reflection */}
                <path
                  d="M39 30 Q50 33 61 30"
                  stroke="#ffffff"
                  strokeWidth="0.8"
                  opacity="0.3"
                  strokeLinecap="round"
                />
              </g>
            </g>
          </g>

          {/* Gradients and Filters Definitions */}
          <defs>
            <radialGradient id="astronaut-aura" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="visor-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Contextual Product Badges Overlay */}
      <div className="absolute inset-0 pointer-events-none overflow-visible z-20">
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="overflow-visible"
        >
          <g className="badge-group">
            {variant === 'invoices' && (
              <g transform="translate(134, 120)">
                <rect
                  x="0"
                  y="0"
                  width="26"
                  height="34"
                  rx="4"
                  fill="#0c0c0e"
                  stroke="var(--user-accent, #10b981)"
                  strokeWidth="1.5"
                  className="shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                />
                <line x1="5" y1="8" x2="15" y2="8" stroke="var(--user-text, #a3a3a3)" strokeWidth="1.5" opacity="0.6" />
                <line x1="5" y1="14" x2="21" y2="14" stroke="var(--user-text, #a3a3a3)" strokeWidth="1" opacity="0.4" />
                <line x1="5" y1="20" x2="18" y2="20" stroke="var(--user-text, #a3a3a3)" strokeWidth="1" opacity="0.4" />
                <circle cx="20" cy="27" r="2.5" fill="var(--user-accent, #10b981)" />
              </g>
            )}

            {variant === 'clients' && (
              <g transform="translate(136, 40)">
                <circle
                  cx="15"
                  cy="15"
                  r="18"
                  fill="none"
                  stroke="var(--user-accent, #10b981)"
                  strokeWidth="1.2"
                  strokeDasharray="3 3"
                  className="animate-[spin_25s_linear_infinite]"
                />
                <circle cx="15" cy="-3" r="5" fill="#0d0d0f" stroke="var(--user-accent, #10b981)" strokeWidth="1.5" />
                <circle cx="-1" cy="23" r="5" fill="#0d0d0f" stroke="var(--user-accent, #10b981)" strokeWidth="1.5" />
                <circle cx="31" cy="23" r="5" fill="#0d0d0f" stroke="var(--user-accent, #10b981)" strokeWidth="1.5" />
                <line x1="15" y1="-3" x2="-1" y2="23" stroke="var(--user-accent, #10b981)" strokeWidth="1" opacity="0.6" />
                <line x1="15" y1="-3" x2="31" y2="23" stroke="var(--user-accent, #10b981)" strokeWidth="1" opacity="0.6" />
              </g>
            )}

            {variant === 'all-clear' && (
              <g transform="translate(138, 115)">
                <rect
                  x="0"
                  y="0"
                  width="28"
                  height="28"
                  rx="6"
                  fill="#0b0b0d"
                  stroke="var(--user-accent, #10b981)"
                  strokeWidth="1.5"
                  className="shadow-[0_0_12px_rgba(16,185,129,0.25)]"
                />
                <path
                  d="M8 14 L12 18 L20 10"
                  stroke="var(--user-accent, #10b981)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            )}

            {variant === 'activity' && (
              <g transform="translate(136, 110)">
                <rect
                  x="0"
                  y="0"
                  width="26"
                  height="26"
                  rx="5"
                  fill="#0c0c0e"
                  stroke="var(--user-text, #a3a3a3)"
                  strokeWidth="1.5"
                  opacity="0.8"
                />
                <path
                  d="M13 6 A3 3 0 0 1 16 9 L16 13 L18 15 L8 15 L10 13 L10 9 A3 3 0 0 1 13 6 Z"
                  fill="var(--user-accent, #10b981)"
                  opacity="0.8"
                />
                <circle cx="13" cy="18" r="1.5" fill="var(--user-accent, #10b981)" />
              </g>
            )}
          </g>
        </svg>
      </div>
    </div>
  )
}
