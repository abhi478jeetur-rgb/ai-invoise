'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { verifyOtpAction, resendOtpAction } from '@/lib/auth/actions'
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
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(60)
  const [resendCount, setResendCount] = useState(0)
  const MAX_RESEND = 5
  
  // Custom 8-digit input boxes state
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '', '', ''])
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
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

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  const handleOtpChange = (index: number, val: string) => {
    // Allow only numeric digits
    if (val && !/^[0-9]$/.test(val)) return

    const newValues = [...otpValues]
    newValues[index] = val
    setOtpValues(newValues)

    // Focus next input box
    if (val && index < 7) {
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
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '')
    if (pastedData.length > 0) {
      const chars = [...otpValues]
      for (let i = 0; i < Math.min(pastedData.length, 8); i++) {
        chars[i] = pastedData[i]
      }
      setOtpValues(chars)
      const nextFocus = Math.min(pastedData.length, 7)
      inputRefs[nextFocus].current?.focus()
    }
  }

  const handleResend = async () => {
    if (resendCount >= MAX_RESEND || resendCooldown > 0) return
    
    setResendLoading(true)
    setError(null)
    setSuccessMsg(null)
    
    try {
      const formData = new FormData()
      formData.set('email', email)
      formData.set('type', typeParam)
      
      const result = await resendOtpAction(formData)
      
      if (result?.error) {
        setError(result.error)
      } else {
        setResendCount(prev => prev + 1)
        setResendCooldown(60)
        setSuccessMsg(result?.message || 'Verification code resent successfully.')
      }
    } catch {
      setError('An unexpected error occurred while resending.')
    } finally {
      setResendLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const finalOtp = otpValues.join('')
      if (finalOtp.length !== 8) {
        setError('Please enter a valid 8-digit code.')
        return
      }

      const formData = new FormData()
      formData.set('email', email)
      formData.set('otp', finalOtp)
      formData.set('type', typeParam)

      const result = await verifyOtpAction(formData)

      if (result?.error) {
        setError(result.error)
      }
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background px-4 py-12 selection:bg-muted overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_500px_at_50%_-100px,var(--muted),transparent)] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-muted/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Main Card Container */}
      <Card className="relative w-full max-w-md border-border bg-card/40 backdrop-blur-xl shadow-2xl p-4">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto inline-flex items-center justify-center w-12 h-12 rounded-xl bg-secondary border border-border mb-2 shadow-inner">
            <span className="text-xl font-bold tracking-tight text-foreground">C</span>
          </div>
          <CardTitle className="text-2xl font-semibold text-foreground tracking-tight">Enter Verification Code</CardTitle>
          <CardDescription className="text-sm text-muted-foreground mt-1">
            We sent an 8-digit code to {email || 'your email'}
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
            
            {successMsg && (
              <div className="p-3 text-xs font-medium bg-green-500/[0.1] border border-green-500/[0.2] text-green-400 rounded-lg text-center backdrop-blur-md animate-in fade-in slide-in-from-top-1 duration-200">
                {successMsg}
              </div>
            )}

            {!emailParam && (
              <div className="space-y-1.5">
                <Label className="text-muted-foreground" htmlFor="email">
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
                  className="h-10 px-3.5 border-border bg-background text-foreground focus-visible:border-ring focus-visible:ring-ring/50"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-muted-foreground text-center block">8-Digit Code</Label>
              <div className="flex justify-center gap-2">
                {otpValues.map((val, idx) => (
                  <input
                    key={idx}
                    ref={inputRefs[idx]}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="one-time-code"
                    maxLength={1}
                    value={val}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    onPaste={handlePaste}
                    className="w-11 h-12 text-center text-lg font-semibold border border-border bg-background text-foreground rounded-lg focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring/50"
                  />
                ))}
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || otpValues.includes('')}
              className="w-full h-10 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-sm transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </Button>
            
            <div className="flex flex-col items-center gap-2 mt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={handleResend}
                disabled={resendCooldown > 0 || resendCount >= MAX_RESEND || resendLoading || !email}
                className="text-xs text-muted-foreground hover:text-foreground h-auto p-2"
              >
                {resendLoading ? (
                  'Resending...'
                ) : resendCooldown > 0 ? (
                  `Resend code in ${resendCooldown}s`
                ) : resendCount >= MAX_RESEND ? (
                  'Maximum resend attempts reached'
                ) : (
                  'Resend Code'
                )}
              </Button>
              {resendCount > 0 && resendCount < MAX_RESEND && (
                 <span className="text-[10px] text-muted-foreground/70">
                   {MAX_RESEND - resendCount} attempts remaining
                 </span>
              )}
            </div>
          </form>

          {/* Footer Links */}
          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              Incorrect email?{' '}
              <Link href="/sign-up" className="text-foreground/80 hover:text-foreground font-medium underline-offset-4 hover:underline transition-all">
                Start over
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
