# Current Task: Version 2 Onboarding (Part 1 - Backend & Database)

**Status:** In Progress

## Checklist
- [x] 1. Update Supabase schema (local types/migrations) for the `profiles` table to include: 
  - `onboarding_completed` (boolean, default false)
  - `profession` (text, nullable)
  - `primary_problem` (text, nullable)
  - `discovery_source` (text, nullable)
  - `credits_balance` (integer, default: 5)
  - `timezone` (text, nullable) - Future: For automated emails (Auto-Pilot).
  - `default_currency` (text, default: 'USD') - Future: For global invoicing.
  - `company_name` (text, nullable) - Future: For professional invoice templates.
  - `company_address` (text, nullable) - Future: For professional invoice templates.
  - `tax_id` (text, nullable) - Future: GST/VAT/EIN number for legal B2B invoices.
  - `logo_url` (text, nullable) - Future: Custom branding on invoices.
  - `theme_preference` (text, default: 'system') - Light/Dark mode.
  - `stripe_customer_id` (text, nullable) - Future: For Stripe/LemonSqueezy payments.
- [x] 2. Create or update the Server Action in `/lib/profile/actions.ts` (or appropriate file) named `updateUserOnboardingAction(data)`. This action should take the survey data and update the authenticated user's profile in Supabase.
- [x] 3. Ensure the action handles errors properly, uses `revalidatePath` if necessary, and returns a clear success/error state.
- [ ] 4. Run `git add .` and `git commit -m "feat(v2): add onboarding db schema and server action"`.

**Note for Open Claude:** Stop exactly here after completing this checklist. Do NOT build the UI yet. We are working in strict, small increments.
