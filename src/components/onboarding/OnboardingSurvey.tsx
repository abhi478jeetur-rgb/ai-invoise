'use client'

import React, { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  onboardingSchema,
  type OnboardingFormData,
  USE_CASE_OPTIONS,
  ROLE_OPTIONS,
  PROBLEM_OPTIONS,
  SETUP_OPTIONS,
} from '@/lib/onboarding/schema'
import { saveOnboardingSurveyAction } from '@/lib/profile/actions'
import { ArrowLeft, Loader2 } from 'lucide-react'

interface OnboardingSurveyProps {
  defaultName?: string
}

const STEPS = [
  { key: 'name', title: 'Welcome to ChaseFree AI', description: "Let's get to know you. What should we call you?" },
  { key: 'use_case', title: 'What do you want to use ChaseFree AI for?', description: 'Select the option that best fits your needs.' },
  { key: 'role', title: 'What is your role?', description: 'This helps us tailor the experience for you.' },
  { key: 'problem', title: 'What is your biggest problem right now?', description: "We'll prioritize features based on this." },
  { key: 'setup', title: 'How would you like to set things up?', description: 'Choose the onboarding style that works for you.' },
] as const

type StepKey = (typeof STEPS)[number]['key']

export function OnboardingSurvey({ defaultName = '' }: OnboardingSurveyProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(true)
  const [currentStep, setCurrentStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      full_name: defaultName,
      use_case: undefined as unknown as OnboardingFormData['use_case'],
      role: undefined as unknown as OnboardingFormData['role'],
      primary_problem: undefined as unknown as OnboardingFormData['primary_problem'],
      setup_preference: undefined as unknown as OnboardingFormData['setup_preference'],
    },
  })

  const step = STEPS[currentStep]
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === STEPS.length - 1

  async function handleNext() {
    setError(null)

    // Validate current step field
    const fieldMap: Record<StepKey, keyof OnboardingFormData> = {
      name: 'full_name',
      use_case: 'use_case',
      role: 'role',
      problem: 'primary_problem',
      setup: 'setup_preference',
    }

    const field = fieldMap[step.key]
    const valid = await trigger(field)
    if (!valid) return

    if (isLastStep) {
      await handleSubmit(onSubmit)()
    } else {
      setCurrentStep((s) => s + 1)
    }
  }

  function handleBack() {
    if (!isFirstStep) {
      setCurrentStep((s) => s - 1)
    }
  }

  async function onSubmit(data: OnboardingFormData) {
    setSubmitting(true)
    setError(null)

    const result = await saveOnboardingSurveyAction(data)

    if (result.error) {
      setError(result.error)
      setSubmitting(false)
      return
    }

    setIsOpen(false)

    // Route based on setup preference
    if (data.setup_preference === 'quick_guided_tour') {
      router.push('/dashboard')
    } else if (data.setup_preference === 'checklist_setup') {
      router.push('/dashboard')
    }
    // "explore_myself" just closes the modal

    router.refresh()
    setSubmitting(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(val) => { if (val) setIsOpen(true); }}>
      <DialogContent
        className="sm:max-w-md bg-background border border-border"
        showCloseButton={false}
      >
        <DialogHeader>
          {!isFirstStep && (
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground/80 transition-colors mb-2 w-fit"
            >
              <ArrowLeft className="h-3 w-3" />
              Back
            </button>
          )}
          <DialogTitle className="text-foreground text-lg">
            {step.title}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            {step.description}
          </DialogDescription>
        </DialogHeader>

        {/* Step Progress */}
        <div className="flex gap-1.5 mb-2">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= currentStep ? 'bg-white' : 'bg-accent'
              }`}
            />
          ))}
        </div>

        {/* Step Content */}
        <div className="min-h-[180px]">
          {step.key === 'name' && (
            <NameStep control={control} errors={errors} />
          )}
          {step.key === 'use_case' && (
            <RadioStep
              name="use_case"
              control={control}
              options={[...USE_CASE_OPTIONS]}
              errors={errors}
            />
          )}
          {step.key === 'role' && (
            <RadioStep
              name="role"
              control={control}
              options={[...ROLE_OPTIONS]}
              errors={errors}
            />
          )}
          {step.key === 'problem' && (
            <RadioStep
              name="primary_problem"
              control={control}
              options={[...PROBLEM_OPTIONS]}
              errors={errors}
            />
          )}
          {step.key === 'setup' && (
            <RadioStep
              name="setup_preference"
              control={control}
              options={[...SETUP_OPTIONS]}
              errors={errors}
              showDescription
            />
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 text-xs font-medium bg-red-500/[0.1] border border-red-500/[0.2] text-red-400 rounded-lg text-center backdrop-blur-md">
            {error}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center gap-2 pt-2">
          <Button
            type="button"
            onClick={handleNext}
            disabled={submitting}
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-sm cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </span>
            ) : isLastStep ? (
              'Get Started'
            ) : (
              'Continue'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Step Components ──────────────────────────────────────────────────────────

function NameStep({ control, errors }: { control: any; errors: any }) {
  return (
    <div className="space-y-3">
      <Label htmlFor="full_name" className="text-muted-foreground">
        Your Name
      </Label>
      <Controller
        name="full_name"
        control={control}
        render={({ field }) => (
          <Input
            {...field}
            id="full_name"
            placeholder="e.g. Jane Smith"
            autoFocus
            className="h-10 border-border bg-secondary text-foreground focus-visible:border-border focus-visible:ring-ring/50"
          />
        )}
      />
      {errors.full_name && (
        <p className="text-xs text-red-400">{errors.full_name.message}</p>
      )}
    </div>
  )
}

function RadioStep({
  name,
  control,
  options,
  errors,
  showDescription = false,
}: {
  name: 'use_case' | 'role' | 'primary_problem' | 'setup_preference'
  control: any
  options: readonly { value: string; label: string; description?: string }[]
  errors: any
  showDescription?: boolean
}) {
  return (
    <div className="space-y-3">
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <RadioGroup
            value={field.value}
            onValueChange={field.onChange}
            className="space-y-2"
          >
            {options.map((opt) => (
              <label
                key={opt.value}
                className={`flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-colors ${
                  field.value === opt.value
                    ? 'border-neutral-600 bg-accent/60'
                    : 'border-border bg-card/40 hover:border-border'
                }`}
              >
                <RadioGroupItem value={opt.value} />
                <div>
                  <span className="text-sm text-foreground">{opt.label}</span>
                  {showDescription && opt.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
                  )}
                </div>
              </label>
            ))}
          </RadioGroup>
        )}
      />
      {errors[name] && (
        <p className="text-xs text-red-400">{errors[name].message}</p>
      )}
    </div>
  )
}
