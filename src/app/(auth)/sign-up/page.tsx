'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signup, signInWithGoogle } from '@/lib/auth/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SignUpPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await signup(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else if (result?.success) {
      setSuccess(result.message || 'Verification link sent!')
      setLoading(false)
      // Redirect to OTP verification screen
      if (result.email) {
        router.push(`/verify-otp?email=${encodeURIComponent(result.email)}&type=signup`)
      }
    }
  }

  async function handleGoogleSignUp() {
    setError(null)
    setGoogleLoading(true)
    const result = await signInWithGoogle()
    if (result?.error) {
      setError(result.error)
      setGoogleLoading(false)
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
          <CardTitle className="text-2xl font-semibold text-neutral-100 tracking-tight">Create an account</CardTitle>
          <CardDescription className="text-sm text-neutral-500 mt-1">
            Get started with ChaseFree AI for free today
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
              <Label className="text-neutral-400" htmlFor="fullName">
                Full Name
              </Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                required
                placeholder="John Doe"
                className="h-10 px-3.5 border-neutral-800 bg-neutral-950 text-neutral-200 focus-visible:border-neutral-700 focus-visible:ring-neutral-700/50"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-neutral-400" htmlFor="email">
                Email Address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="name@company.com"
                className="h-10 px-3.5 border-neutral-800 bg-neutral-950 text-neutral-200 focus-visible:border-neutral-700 focus-visible:ring-neutral-700/50"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-neutral-400" htmlFor="password">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="h-10 px-3.5 border-neutral-800 bg-neutral-950 text-neutral-200 focus-visible:border-neutral-700 focus-visible:ring-neutral-700/50"
              />
              <p className="text-[10px] text-neutral-500 leading-normal">
                Must be at least 8 characters, contain one uppercase letter, one lowercase letter, one number, and one special character.
              </p>
            </div>

            <Button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full h-10 rounded-lg bg-white text-black hover:bg-neutral-200 font-medium text-sm transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </Button>
          </form>

          {/* Social Sign-In Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-900"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#0e0e0f] px-2 text-neutral-500">Or continue with</span>
            </div>
          </div>

          {/* Google Sign-Up Button */}
          <Button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={loading || googleLoading}
            className="w-full h-10 rounded-lg bg-neutral-900 border border-neutral-850 hover:bg-neutral-800 text-neutral-200 font-medium text-sm transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 shadow-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            {googleLoading ? 'Connecting...' : 'Sign Up with Google'}
          </Button>

          {/* Footer Links */}
          <div className="mt-6 pt-6 border-t border-neutral-900 text-center">
            <p className="text-xs text-neutral-500">
              Already have an account?{' '}
              <Link href="/sign-in" className="text-neutral-300 hover:text-white font-medium underline-offset-4 hover:underline transition-all">
                Sign in instead
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
