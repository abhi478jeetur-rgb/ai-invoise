'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { verifyOtpAction } from '@/lib/auth/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function VerifyOtpPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const emailParam = searchParams?.get('email') || ''
  const typeParam = searchParams?.get('type') || 'signup' // 'signup' or 'recovery'

  const [email, setEmail] = useState(emailParam)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  
  // Custom 6-digit input boxes state
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', ''])
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]

  useEffect(() => {
    // Focus first input initially
    inputRefs[0].current?.focus()
  }, [])

  const handleOtpChange = (index: number, val: string) => {
    // Allow only numeric digits
    if (val && !/^[0-9]$/.test(val)) return

    const newValues = [...otpValues]
    newValues[index] = val
    setOtpValues(newValues)

    // Focus next input box
    if (val && index < 5) {
      inputRefs[index + 1].current?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      // Focus previous input box
      inputRefs[index - 1].current?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').trim()
    if (/^[0-9]{6}$/.test(pastedData)) {
      const chars = pastedData.split('')
      setOtpValues(chars)
      inputRefs[5].current?.focus()
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const finalOtp = otpValues.join('')
    if (finalOtp.length !== 6) {
      setError('Please enter a valid 6-digit code.')
      setLoading(false)
      return
    }

    const formData = new FormData()
    formData.set('email', email)
    formData.set('otp', finalOtp)
    formData.set('type', typeParam)

    const result = await verifyOtpAction(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-neutral-950 px-4 py-12 selection:bg-neutral-800 overflow-hidden">
      {/* Background ambient radial gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_500px_at_50%_-100px,rgba(24,24,27,0.8),transparent)] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neutral-900/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Main Card Container */}
      <Card className="relative w-full max-w-md border-neutral-900 bg-neutral-900/40 backdrop-blur-xl shadow-2xl p-4">
        {/* Top Header */}
        <CardHeader className="text-center pb-4">
          <div className="mx-auto inline-flex items-center justify-center w-12 h-12 rounded-xl bg-neutral-900 border border-neutral-800 mb-2 shadow-inner">
            <span className="text-xl font-bold tracking-tight text-white">C</span>
          </div>
          <CardTitle className="text-2xl font-semibold text-neutral-100 tracking-tight">Enter Verification Code</CardTitle>
          <CardDescription className="text-sm text-neutral-500 mt-1">
            We sent a 6-digit code to {email || 'your email'}
          </CardDescription>
        </CardHeader>

        {/* Action Form */}
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 text-xs font-medium bg-red-500/[0.1] border border-red-500/[0.2] text-red-400 rounded-lg text-center backdrop-blur-md animate-in fade-in slide-in-from-top-1 duration-200">
                {error}
              </div>
            )}

            {!emailParam && (
              <div className="space-y-1.5">
                <Label className="text-neutral-400" htmlFor="email">
                  Confirm Email Address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="h-10 px-3.5 border-neutral-800 bg-neutral-950 text-neutral-200 focus-visible:border-neutral-700 focus-visible:ring-neutral-700/50"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-neutral-400 text-center block">6-Digit Code</Label>
              <div className="flex justify-center gap-2" onPaste={handlePaste}>
                {otpValues.map((val, idx) => (
                  <input
                    key={idx}
                    ref={inputRefs[idx]}
                    type="text"
                    maxLength={1}
                    value={val}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className="w-11 h-12 text-center text-lg font-semibold border border-neutral-800 bg-neutral-950 text-white rounded-lg focus:outline-none focus:border-neutral-700 focus:ring-1 focus:ring-neutral-700/50"
                  />
                ))}
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || otpValues.includes('')}
              className="w-full h-10 rounded-lg bg-white text-black hover:bg-neutral-200 font-medium text-sm transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </Button>
          </form>

          {/* Footer Links */}
          <div className="mt-6 pt-6 border-t border-neutral-900 text-center">
            <p className="text-xs text-neutral-500">
              Incorrect email?{' '}
              <Link href="/sign-up" className="text-neutral-300 hover:text-white font-medium underline-offset-4 hover:underline transition-all">
                Start over
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
