# Current Task: Version 2 Onboarding (Part 4 - Advanced UI & UX Polish)

**Status:** In Progress

## Context
The basic UI is built, but it lacks the "Premium SaaS" feel. Users cannot navigate backward, and the "Other" options don't allow custom text input. We need to upgrade this modal to be fully robust, navigable, and detailed.

## Strict Checklist for `src/components/onboarding/OnboardingModal.tsx`

### 1. Navigation & Progress
- [x] **"Previous" Button:** Add a "Back" button next to "Next". Users must be able to return to previous steps without losing the data they already clicked/typed. (Hide it on Step 1).
- [x] **Progress Indicator:** Add a visual indicator at the top (e.g., "Step 1 of 3" or a progress bar) so the user knows how many steps remain.
- [x] **Validation:** The "Next" button on Step 1 MUST be disabled if the user's name is empty.

### 2. The "Other" Option (Dynamic Inputs)
- [x] **Profession (Step 2):** Add "Other" to the clickable options. If the user selects "Other", conditionally render a Shadcn `<Input />` directly below it so they can type their exact profession.
- [x] **Discovery Source (Step 3):** Add "Other" to the options. If selected, render a text `<Input />` for them to type.
- [x] Ensure the text typed into these "Other" inputs is what gets saved to the state and sent to the database.

### 3. Loading & Error Handling
- [x] **Submit State:** On the final step, when "Complete" is clicked, disable the button and show a loading state (e.g., "Submitting..." or a spinner) to prevent double submissions.
- [x] **Error UI:** If `updateUserOnboardingAction` returns an error, show it cleanly using Shadcn Toasts or an inline red text alert.

### 4. Commit
- [ ] Run `git add .` and `git commit -m "refactor(v2): add previous button, dynamic other inputs, and loading states to onboarding"`.

**Note for Open Claude:** Do not assume anything. Build exactly this. This file is your strict blueprint. Do not skip the "Previous" button or the conditional "Other" inputs. Check off [x] as you go.
