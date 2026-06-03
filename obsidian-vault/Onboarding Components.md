---
tags: [components, onboarding]
created: 2026-05-31
---

# Onboarding Components

## Overview
5-step onboarding survey for new users.

## Location
`src/components/onboarding/`

## Components

### OnboardingSurvey
**File:** `OnboardingSurvey.tsx`
- Multi-step form
- Navigation (next/back)
- Progress indicator
- Data persistence

### Steps
| Step | Key | Purpose |
|------|-----|---------|
| 1 | `businessName` | Business name |
| 2 | `businessEmail` | Business email |
| 3 | `businessPhone` | Phone number |
| 4 | `businessAddress` | Address |
| 5 | `defaultCurrency` | Currency preference |

## Validation
**File:** `src/lib/onboarding/schema.ts`
- Zod schema for each step
- `StepKey` type definition

## Related Notes
- [[Architecture Overview]]
- [[Settings Domain]]
- [[UI Components]]
