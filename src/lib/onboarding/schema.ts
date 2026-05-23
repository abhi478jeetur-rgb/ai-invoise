import { z } from 'zod'

export const onboardingSchema = z.object({
  full_name: z
    .string()
    .min(1, 'Please enter your name.')
    .max(100, 'Name must be 100 characters or less.'),

  use_case: z.enum(
    ['tracking_late_invoices', 'sending_ai_reminders', 'sending_client_messages', 'all_of_the_above'],
    'Please select a use case.'
  ),

  role: z.enum(
    ['freelancer', 'agency_owner', 'small_business', 'accountant', 'financier', 'other'],
    'Please select your role.'
  ),

  primary_problem: z.enum(
    ['payments_are_late', 'followups_are_manual', 'clients_are_scattered', 'no_invoice_visibility'],
    'Please select your biggest problem.'
  ),

  setup_preference: z.enum(
    ['quick_guided_tour', 'checklist_setup', 'explore_myself'],
    'Please select a setup option.'
  ),
})

export type OnboardingFormData = z.infer<typeof onboardingSchema>

export const USE_CASE_OPTIONS = [
  { value: 'tracking_late_invoices', label: 'Tracking late invoices' },
  { value: 'sending_ai_reminders', label: 'Sending AI reminders' },
  { value: 'sending_client_messages', label: 'Sending client messages' },
  { value: 'all_of_the_above', label: 'All of the above' },
] as const

export const ROLE_OPTIONS = [
  { value: 'freelancer', label: 'Freelancer' },
  { value: 'agency_owner', label: 'Agency Owner' },
  { value: 'small_business', label: 'Small Business' },
  { value: 'accountant', label: 'Accountant' },
  { value: 'financier', label: 'Financier' },
  { value: 'other', label: 'Other' },
] as const

export const PROBLEM_OPTIONS = [
  { value: 'payments_are_late', label: 'Payments are late' },
  { value: 'followups_are_manual', label: 'Follow-ups are manual' },
  { value: 'clients_are_scattered', label: 'Clients are scattered' },
  { value: 'no_invoice_visibility', label: 'No invoice visibility' },
] as const

export const SETUP_OPTIONS = [
  { value: 'quick_guided_tour', label: 'Quick Guided Tour', description: 'We walk you through each step.' },
  { value: 'checklist_setup', label: 'Checklist-Based Setup', description: 'A checklist of things to get started.' },
  { value: 'explore_myself', label: 'I will explore myself', description: 'No further onboarding needed.' },
] as const
