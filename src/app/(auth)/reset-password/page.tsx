'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { updatePassword } from '@/lib/auth/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  // H16: Store timeout ID in ref for cleanup
  const redirectTimerRef = useRef<NodeJS.Timeout | null>(null)

  // H16: Cleanup timeout on unmount to prevent memory leak
  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current)
      }
    }
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await updatePassword(formData)

    if (result && 'error' in result) {
      setError(result.error)
      setLoading(false)
    } else if (result && 'success' in result) {
      setSuccess(result.message || 'Password successfully updated!')
      setLoading(false)
      // H16: Store timeout ID for cleanup
      redirectTimerRef.current = setTimeout(() => {
        router.push('/sign-in')
      }, 2000)
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
          <CardTitle className="text-2xl font-semibold text-foreground tracking-tight">Set New Password</CardTitle>
          <CardDescription className="text-sm text-muted-foreground mt-1">
            Please enter your new strong password below
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
              <Label className="text-muted-foreground" htmlFor="password">
                New Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="h-10 px-3.5 border-border bg-background text-foreground focus-visible:border-ring focus-visible:ring-ring/50"
              />
              <p className="text-[10px] text-muted-foreground leading-normal">
                Must be at least 8 characters, contain one uppercase letter, one lowercase letter, one number, and one special character.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-muted-foreground" htmlFor="confirmPassword">
                Confirm New Password
              </Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                placeholder="••••••••"
                className="h-10 px-3.5 border-border bg-background text-foreground focus-visible:border-ring focus-visible:ring-ring/50"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-sm transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {loading ? 'Updating password...' : 'Update Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
