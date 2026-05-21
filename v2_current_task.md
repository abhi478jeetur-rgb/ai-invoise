# Current Task: Version 2 Onboarding (Part 3 - Frontend UI Refinements)

**Status:** In Progress

## Context
The user tested `OnboardingModal.tsx` and found it too basic. We need to replace plain text inputs with rich Shadcn Select/Radio/Badge toggle options so the user just has to "click" rather than type.

## Checklist for `src/components/onboarding/OnboardingModal.tsx`
- [x] 1. **Step 1 (Name):** Keep as a text input (Mandatory).
- [x] 2. **Step 2 (Profession):** Instead of a text box, use clickable options (like Radio cards or Shadcn Select). Options: 
  - Freelance Designer
  - Software Developer
  - Marketing Agency
  - Consultant
  - Creator / Writer
  - Other
- [x] 3. **Step 3 (Primary Problem):** Use clickable options. Options:
  - "Clients pay late (I need reminders)"
  - "Creating invoices takes too long"
  - "Tracking who owes me money"
  - "I want to look more professional"
- [x] 4. **Step 4 (Discovery Source):** Use clickable options. Options:
  - Twitter / X
  - YouTube
  - Google Search
  - Friend / Colleague
  - Product Hunt
- [x] 5. Ensure the selected options are saved to state and passed correctly to `updateUserOnboardingAction`.
- [x] 6. Keep the existing Glassmorphism UI.
- [ ] 7. Run `git add .` and `git commit -m "refactor(v2): upgrade onboarding modal with rich selectable options"`.

**Note for Open Claude:** Do not build anything else. Refactor the existing modal and commit. Mark checkboxes when done.
