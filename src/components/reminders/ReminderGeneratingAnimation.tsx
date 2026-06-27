'use client'

import React, { useRef, useState, useEffect } from "react"
import { gsap } from "gsap"
import { useGSAP } from "@gsap/react"

gsap.registerPlugin(useGSAP)

const DEFAULT_MESSAGES = [
  "Scanning invoice data...",
  "Reading line items...",
  "Calibrating relationship-safe tone...",
  "Analyzing payment history...",
  "Checking overdue duration...",
  "Drafting message...",
]

interface Props {
  title?: string
  statusMessages?: string[]
}

export function ReminderGeneratingAnimation({
  title = "Generating Reminder",
  statusMessages = DEFAULT_MESSAGES,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  // SVG element refs
  const cornersRef = useRef<SVGPathElement[]>([])
  const paperRef = useRef<SVGGElement>(null)
  const paperScanRef = useRef<SVGLineElement>(null)
  const paperHlRef = useRef<SVGRectElement>(null)
  const glowRingRef = useRef<SVGCircleElement>(null)
  const eyeGroupRef = useRef<SVGGElement>(null)
  const irisRef = useRef<SVGCircleElement>(null)
  const irisRing1Ref = useRef<SVGCircleElement>(null)
  const irisRing2Ref = useRef<SVGCircleElement>(null)
  const pupilRef = useRef<SVGCircleElement>(null)

  // Status text cycling
  const [msgIndex, setMsgIndex] = useState(0)
  const [msgVisible, setMsgVisible] = useState(true)

  useEffect(() => {
    const id = setInterval(() => {
      setMsgVisible(false)
      setTimeout(() => {
        setMsgIndex((i) => (i + 1) % statusMessages.length)
        setMsgVisible(true)
      }, 300)
    }, 2200)
    return () => clearInterval(id)
  }, [statusMessages.length])

  // ── GSAP animations ──────────────────────────────────────────────
  useGSAP(() => {
    const mm = gsap.matchMedia()

    mm.add(
      {
        motion: "(prefers-reduced-motion: no-preference)",
        reduceMotion: "(prefers-reduced-motion: reduce)",
      },
      (ctx) => {
        const { reduceMotion } = ctx.conditions as { reduceMotion: boolean }
        const dur = reduceMotion ? 0 : 1 // collapse all durations when reduced

        // ── 1. Corner brackets draw in on mount ──
        cornersRef.current.forEach((el, i) => {
          if (!el) return
          gsap.fromTo(
            el,
            { strokeDashoffset: 32, autoAlpha: 0 },
            { strokeDashoffset: 0, autoAlpha: 1, duration: dur * 0.5, ease: "power2.out", delay: i * 0.1 }
          )
        })

        // ── 2. Glow ring pulse (infinite) ──
        gsap.to(glowRingRef.current, {
          opacity: 0.28, scale: 1.04,
          duration: dur * 1.3, ease: "sine.inOut",
          repeat: -1, yoyo: true,
          transformOrigin: "50% 50%",
        })

        // ── 3. Paper float (infinite) ──
        gsap.to(paperRef.current, {
          y: reduceMotion ? 0 : -4,
          duration: dur * 2, ease: "sine.inOut",
          repeat: -1, yoyo: true,
        })

        // ── 4. Scan line on paper — timeline loops ──
        const scanTL = gsap.timeline({ repeat: -1, defaults: { ease: "none" } })
        scanTL
          .set([paperScanRef.current, paperHlRef.current], { y: -52, autoAlpha: 0 })
          .to([paperScanRef.current, paperHlRef.current], { autoAlpha: 1, duration: dur * 0.12 })
          .to([paperScanRef.current, paperHlRef.current], { y: 52, duration: dur * 2.6, ease: "power1.inOut" }, "<")
          .to([paperScanRef.current, paperHlRef.current], { autoAlpha: 0, duration: dur * 0.12 }, "-=0.12")
          .set([paperScanRef.current, paperHlRef.current], { y: -52 })

        // ── 5. Iris breathe (infinite) ──
        ;[irisRef, irisRing1Ref, irisRing2Ref].forEach((ref) => {
          gsap.to(ref.current, {
            scale: 1.1, duration: dur * 1.5, ease: "sine.inOut",
            repeat: -1, yoyo: true, transformOrigin: "50% 50%",
          })
        })

        // ── 6. Pupil contract (opposite phase to iris) ──
        gsap.to(pupilRef.current, {
          scale: 0.74, duration: dur * 1.5, ease: "sine.inOut",
          repeat: -1, yoyo: true, transformOrigin: "50% 50%",
        })

        // ── 7. Blink every ~6s ──
        const blinkTL = gsap.timeline({ repeat: -1, repeatDelay: 5.5 })
        blinkTL
          .to(eyeGroupRef.current, {
            scaleY: 0.06, duration: dur * 0.08,
            ease: "power2.in", transformOrigin: "50% 50%",
          })
          .to(eyeGroupRef.current, {
            scaleY: 1, duration: dur * 0.1,
            ease: "power2.out", transformOrigin: "50% 50%",
          })
      }
    )

    return () => mm.revert()
  }, { scope: containerRef })

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div ref={containerRef} className="flex flex-col items-center gap-5 py-8 px-6">
      <svg
        width="200" height="210"
        viewBox="-100 -100 200 210"
        role="img"
        aria-label="AI scanning invoice to generate payment reminder"
        style={{ overflow: "visible" }}
      >
        <defs>
          <clipPath id="rga5-eye-clip">
            <ellipse cx="0" cy="0" rx="42" ry="26" />
          </clipPath>
          <clipPath id="rga5-paper-clip">
            <rect x="-40" y="10" width="80" height="108" rx="5" />
          </clipPath>
          <radialGradient id="rga5-iris-g" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#052e16" />
            <stop offset="60%" stopColor="#14532d" />
            <stop offset="100%" stopColor="#1a6b3c" />
          </radialGradient>
        </defs>

        {/* ── Corner brackets ── */}
        {[
          "M-62,-80 L-80,-80 L-80,-62",
          "M62,-80 L80,-80 L80,-62",
          "M-62,110 L-80,110 L-80,92",
          "M62,110 L80,110 L80,92",
        ].map((d, i) => (
          <path
            key={i}
            ref={(el) => { if (el) cornersRef.current[i] = el }}
            d={d}
            fill="none"
            stroke="#22c55e"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeDasharray="32"
            style={{ visibility: "hidden" }}
          />
        ))}

        {/* ── Glow ring ── */}
        <circle
          ref={glowRingRef}
          cx="0" cy="0" r="50"
          fill="none" stroke="#22c55e" strokeWidth="1"
          style={{ opacity: 0.1 }}
        />

        {/* ── Invoice paper ── */}
        <g ref={paperRef}>
          {/* Shadow */}
          <rect x="-36" y="13" width="80" height="108" rx="5" fill="#000" opacity=".4" transform="translate(2,3)" />
          {/* Body */}
          <rect x="-40" y="10" width="80" height="108" rx="5" fill="#0d1f13" stroke="#1e4d2b" strokeWidth="1" />
          {/* Header */}
          <rect x="-40" y="10" width="80" height="14" rx="5" fill="#14532d" opacity=".55" />
          <rect x="-40" y="20" width="80" height="4" fill="#14532d" opacity=".55" />
          <rect x="-28" y="14" width="28" height="5" rx="2" fill="#22c55e" opacity=".55" />
          <rect x="10" y="14" width="16" height="5" rx="2" fill="#22c55e" opacity=".28" />
          <line x1="-34" y1="30" x2="34" y2="30" stroke="#22c55e" strokeWidth=".5" opacity=".2" />
          {/* Amount */}
          <rect x="-32" y="35" width="16" height="4" rx="1.5" fill="#22c55e" opacity=".2" />
          <rect x="-32" y="42" width="30" height="7" rx="2" fill="#22c55e" opacity=".4" />
          {/* Status pill */}
          <rect x="14" y="35" width="20" height="7" rx="3.5" fill="#854d0e" opacity=".65" />
          <rect x="16" y="37" width="16" height="3" rx="1" fill="#fbbf24" opacity=".6" />
          {/* Text lines */}
          {[[64, 0.0], [50, 0.3], [58, 0.6], [44, 0.9], [62, 1.2]].map(([w, delay], i) => (
            <rect key={i} x="-32" y={56 + i * 10} width={w} height="3.5" rx="1.5" fill="#22c55e" opacity=".12" />
          ))}
          <line x1="-34" y1="110" x2="34" y2="110" stroke="#22c55e" strokeWidth=".5" opacity=".15" />
          <rect x="-32" y="114" width="22" height="3.5" rx="1" fill="#22c55e" opacity=".2" />
          <rect x="10" y="114" width="18" height="3.5" rx="1" fill="#4ade80" opacity=".3" />

          {/* Scan highlight on paper */}
          <rect
            ref={paperHlRef}
            x="-40" y="0" width="80" height="12"
            fill="#22c55e" opacity=".15"
            clipPath="url(#rga5-paper-clip)"
            style={{ visibility: "hidden" }}
          />
          {/* Scan line on paper */}
          <line
            ref={paperScanRef}
            x1="-40" y1="0" x2="40" y2="0"
            stroke="#4ade80" strokeWidth="1.2"
            clipPath="url(#rga5-paper-clip)"
            style={{ visibility: "hidden" }}
          />
        </g>

        {/* ── Eye ── */}
        <g ref={eyeGroupRef}>
          <ellipse cx="0" cy="0" rx="42" ry="26" fill="#080f0a" stroke="#22c55e" strokeWidth="1.8" />
          <path d="M-42,0 Q0,-28 42,0" fill="none" stroke="#22c55e" strokeWidth=".6" opacity=".3" />
          <path d="M-42,0 Q0,28 42,0" fill="none" stroke="#22c55e" strokeWidth=".6" opacity=".3" />
          <g clipPath="url(#rga5-eye-clip)">
            <circle ref={irisRef} cx="0" cy="0" r="21" fill="url(#rga5-iris-g)" stroke="#22c55e" strokeWidth=".8" />
            <circle ref={irisRing1Ref} cx="0" cy="0" r="15" fill="none" stroke="#22c55e" strokeWidth=".7" opacity=".45" />
            <circle ref={irisRing2Ref} cx="0" cy="0" r="9" fill="none" stroke="#4ade80" strokeWidth=".5" opacity=".3" />
            <circle ref={pupilRef} cx="0" cy="0" r="9" fill="#000" />
            <circle cx="-5" cy="-5" r="2.5" fill="white" opacity=".5" />
            <circle cx="5" cy="4" r="1.2" fill="white" opacity=".2" />
          </g>
        </g>
      </svg>

      {/* Status text */}
      <div className="text-center mt-2">
        <p className="text-[15px] font-semibold text-emerald-50 mb-1.5 tracking-wide">{title}</p>
        <p
          className="text-xs text-emerald-400 m-0 transition-all duration-300 ease-out"
          style={{
            opacity: msgVisible ? 1 : 0,
            transform: msgVisible ? "translateY(0)" : "translateY(-5px)",
          }}
        >
          {statusMessages[msgIndex]}
        </p>
      </div>
    </div>
  )
}
