'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { signup } from '@/lib/auth/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SignUpPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await signup(formData)

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
          <CardTitle className="text-2xl font-semibold text-neutral-100 tracking-tight">Create an account</CardTitle>
          <CardDescription className="text-sm text-neutral-500 mt-1">Get started with ChaseFree AI for free today</CardDescription>
        </CardHeader>

        {/* Action Form */}
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-xs font-medium bg-red-500/[0.1] border border-red-500/[0.2] text-red-400 rounded-lg text-center backdrop-blur-md animate-in fade-in slide-in-from-top-1 duration-200">
                {error}
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
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-lg bg-white text-black hover:bg-neutral-200 font-medium text-sm transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </Button>
          </form>

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
