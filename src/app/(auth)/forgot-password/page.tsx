'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { sendPasswordReset } from '@/lib/auth/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'
import { useRef } from 'react'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string>('')
  const turnstileRef = useRef<TurnstileInstance>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await sendPasswordReset(formData)

    if (result && 'error' in result) {
      setError(result.error)
      setLoading(false)
      turnstileRef.current?.reset()
    } else if (result && 'success' in result) {
      setSuccess(result.message || 'Password reset email sent!')
      setLoading(false)
      // Redirect to OTP verification screen for recovery
      if (result.email) {
        router.push(`/verify-otp?email=${encodeURIComponent(result.email)}&type=recovery`)
      }
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background px-4 py-12 selection:bg-muted overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_500px_at_50%_-100px,var(--muted),transparent)] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-muted/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Main Card Container */}
      <Card className="relative w-full max-w-md border-border bg-card/40 backdrop-blur-xl shadow-2xl p-4">
        {/* Top Header */}
        <CardHeader className="text-center pb-4">
          <div className="mx-auto inline-flex items-center justify-center w-12 h-12 rounded-xl bg-secondary border border-border mb-2 shadow-inner">
            <span className="text-xl font-bold tracking-tight text-foreground">C</span>
          </div>
          <CardTitle className="text-2xl font-semibold text-foreground tracking-tight">Forgot Password</CardTitle>
          <CardDescription className="text-sm text-muted-foreground mt-1">
            Enter your email to receive a password reset link
          </CardDescription>
        </CardHeader>

        {/* Action Form */}
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-xs font-medium bg-red-500/[0.1] border border-red-500/[0.2] text-red-400 rounded-lg text-center backdrop-blur-md animate-in fade-in slide-in-from-top-1 duration-200">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 text-xs font-medium bg-green-500/[0.1] border border-green-500/[0.2] text-green-400 rounded-lg text-center backdrop-blur-md animate-in fade-in slide-in-from-top-1 duration-200">
                {success}
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-muted-foreground" htmlFor="email">
                Email Address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="name@company.com"
                className="h-10 px-3.5 border-border bg-background text-foreground focus-visible:border-ring focus-visible:ring-ring/50"
              />
            </div>

            <div className="flex justify-center py-2 min-h-[65px]">
              <Turnstile 
                ref={turnstileRef}
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'} 
                options={{ theme: 'auto', appearance: 'always' }}
                onSuccess={(token) => setTurnstileToken(token)}
                onExpire={() => setTurnstileToken('')}
                onError={() => setTurnstileToken('')}
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-sm transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {loading ? 'Sending link...' : 'Send Reset Link'}
            </Button>
          </form>

          {/* Footer Links */}
          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              Remember your password?{' '}
              <Link href="/sign-in" className="text-foreground/80 hover:text-foreground font-medium underline-offset-4 hover:underline transition-all">
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
