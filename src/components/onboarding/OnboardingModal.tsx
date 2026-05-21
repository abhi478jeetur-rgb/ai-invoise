'use client'

import { useState, useTransition } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { updateUserOnboardingAction } from '@/lib/profile/actions'

interface OnboardingModalProps {
  initialOpen?: boolean
}

export function OnboardingModal({ initialOpen = false }: OnboardingModalProps) {
  const [open, setOpen] = useState(initialOpen)
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ full_name: '', profession: '', primary_problem: '', discovery_source: '' })
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const updateForm = (key: keyof typeof form, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const canGoNext = () => {
    if (step === 1) return form.full_name.trim().length > 0
    return true
  }

  const handleNext = () => {
    if (canGoNext() && step < 3) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleSkip = () => {
    if (step < 3) setStep(step + 1)
  }

  const handleSubmit = () => {
    setError(null)
    startTransition(async () => {
      const result = await updateUserOnboardingAction({
        full_name: form.full_name,
        profession: form.profession || undefined,
        primary_problem: form.primary_problem || undefined,
        discovery_source: form.discovery_source || undefined,
      })
      if (result?.error) {
        setError(result.error)
      } else {
        setOpen(false)
      }
    })
  }

  const discoveryOptions = ['Twitter / X', 'LinkedIn', 'Google Search', 'Referral', 'Product Hunt', 'Other']

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[480px] border-neutral-800 bg-neutral-950/95 backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-neutral-100">Welcome to ChaseFree AI</DialogTitle>
          <DialogDescription className="text-sm text-neutral-500">Quick setup to personalize your experience.</DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center gap-2 py-2">
          {[1,2,3].map((s) => (
            <div key={s} className={`h-1.5 w-8 rounded-full transition-all ${s <= step ? 'bg-neutral-100' : 'bg-neutral-800'}`} />
          ))}
        </div>

        {error && (
          <div className="p-3 text-xs font-medium bg-red-950/30 border border-red-900/50 text-red-400 rounded-lg text-center">{error}</div>
        )}

        {step === 1 && (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="full_name" className="text-neutral-400">Full Name</Label>
              <Input id="full_name" value={form.full_name} onChange={(e) => updateForm('full_name', e.target.value)} placeholder="Alex Rivera" className="bg-neutral-900/50 border-neutral-800" />
            </div>
            <div className="text-[11px] text-neutral-500">This will appear on your invoices and reminders.</div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-neutral-400">Profession (optional)</Label>
              <Input value={form.profession} onChange={(e) => updateForm('profession', e.target.value)} placeholder="Freelance Designer" className="bg-neutral-900/50 border-neutral-800" />
            </div>
            <div className="space-y-2">
              <Label className="text-neutral-400">What is your biggest challenge with invoices?</Label>
              <Input value={form.primary_problem} onChange={(e) => updateForm('primary_problem', e.target.value)} placeholder="Chasing late payments" className="bg-neutral-900/50 border-neutral-800" />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-neutral-400">How did you hear about us?</Label>
              <Select value={form.discovery_source} onValueChange={(v) => updateForm('discovery_source', v)}>
                <SelectTrigger className="bg-neutral-900/50 border-neutral-800 w-full">
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent className="border-neutral-800 bg-neutral-950/95 backdrop-blur-sm">
                  {discoveryOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
          <div>
            {step > 1 && (
              <Button variant="ghost" size="sm" onClick={handleBack} disabled={isPending}>Back</Button>
            )}
          </div>
          <div className="flex gap-2">
            {step < 3 && (
              <Button variant="ghost" size="sm" onClick={handleSkip} disabled={isPending}>Skip</Button>
            )}
            {step < 3 ? (
              <Button size="sm" onClick={handleNext} disabled={!canGoNext() || isPending}>Next</Button>
            ) : (
              <Button size="sm" onClick={handleSubmit} disabled={isPending}>
                {isPending ? 'Saving...' : 'Complete Setup'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
