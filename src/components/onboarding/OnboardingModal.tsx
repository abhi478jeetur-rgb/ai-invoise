'use client'

import { useState, useTransition } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
    if (canGoNext() && step < 4) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleSkip = () => {
    if (step < 4) setStep(step + 1)
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

  const professionOptions = ['Freelance Designer', 'Software Developer', 'Marketing Agency', 'Consultant', 'Creator / Writer', 'Other']
  const problemOptions = ['Clients pay late (I need reminders)', 'Creating invoices takes too long', 'Tracking who owes me money', 'I want to look more professional']
  const sourceOptions = ['Twitter / X', 'YouTube', 'Google Search', 'Friend / Colleague', 'Product Hunt']

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[480px] border-neutral-800 bg-neutral-950/95 backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-neutral-100">Welcome to ChaseFree AI</DialogTitle>
          <DialogDescription className="text-sm text-neutral-500">Quick setup to personalize your experience.</DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center gap-2 py-2">
          {[1,2,3,4].map((s) => (
            <div key={s} className={`h-1.5 w-6 rounded-full transition-all ${s <= step ? 'bg-neutral-100' : 'bg-neutral-800'}`} />
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
            <Label className="text-neutral-400">What best describes you?</Label>
            <div className="grid grid-cols-2 gap-2">
              {professionOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => updateForm('profession', opt)}
                  className={`p-3 rounded-lg border text-sm text-left transition-all cursor-pointer ${form.profession === opt ? 'border-neutral-600 bg-neutral-800/80 text-neutral-100' : 'border-neutral-800/60 bg-neutral-900/30 hover:bg-neutral-900/50 text-neutral-300'}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 py-2">
            <Label className="text-neutral-400">What is your biggest challenge with invoices?</Label>
            <div className="grid grid-cols-1 gap-2">
              {problemOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => updateForm('primary_problem', opt)}
                  className={`p-3 rounded-lg border text-sm text-left transition-all cursor-pointer ${form.primary_problem === opt ? 'border-neutral-600 bg-neutral-800/80 text-neutral-100' : 'border-neutral-800/60 bg-neutral-900/30 hover:bg-neutral-900/50 text-neutral-300'}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4 py-2">
            <Label className="text-neutral-400">How did you hear about us?</Label>
            <div className="grid grid-cols-2 gap-2">
              {sourceOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => updateForm('discovery_source', opt)}
                  className={`p-3 rounded-lg border text-sm text-left transition-all cursor-pointer ${form.discovery_source === opt ? 'border-neutral-600 bg-neutral-800/80 text-neutral-100' : 'border-neutral-800/60 bg-neutral-900/30 hover:bg-neutral-900/50 text-neutral-300'}`}
                >
                  {opt}
                </button>
              ))}
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
            {step < 4 && (
              <Button variant="ghost" size="sm" onClick={handleSkip} disabled={isPending}>Skip</Button>
            )}
            {step < 4 ? (
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
