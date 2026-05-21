# Current Task: Version 2 Onboarding (Part 2 - Frontend UI)

**Status:** In Progress

## Context
The backend action `updateUserOnboardingAction` in `src/lib/profile/actions.ts` and the database schema are complete.

## Checklist
- [x] 1. Create a new client component (e.g., `src/components/onboarding/OnboardingModal.tsx`).
- [x] 2. The component MUST use strictly **Shadcn/ui** components (Dialog/Card, Button, Input, Progress/Stepper) and follow a Glassmorphism theme (backdrop-blur-sm).
- [x] 3. Implement a 3-step form state:
  - Step 1: Full Name (Mandatory).
  - Step 2: Profession & Primary Problem (Skippable).
  - Step 3: Discovery Source (Skippable).
- [x] 4. Connect the form submission to `updateUserOnboardingAction`. When successful, close the modal and let the UI refresh.
- [x] 5. Import and render this modal in `src/app/dashboard/layout.tsx` or `page.tsx` (only showing it if the user's `onboarding_completed` is false). Note: You may need to fetch the profile data on the server first.
- [ ] 6. Run `git add .` and `git commit -m "feat(v2): add onboarding survey UI modal"`.

**Note for Open Claude:** Do not build the Product Tour tooltips yet. Focus strictly on this multi-step modal. Mark the checklist as you progress.
