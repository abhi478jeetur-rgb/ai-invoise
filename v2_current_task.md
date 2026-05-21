# Current Task: Version 2 - Dashboard Quick Start Banner (Empty State)

**Status:** Complete

## Context
When a new user finishes onboarding, their dashboard is completely empty. This causes "Blank Slate Syndrome" where they don't know what to do next. We need to build a "Quick Start Banner" on the `/dashboard` page that guides them through the core workflow.

## Strict Checklist for Open Claude

### 1. Create the Banner Component (`src/components/dashboard/QuickStartBanner.tsx`)
- [x] Create this as a React Client Component (`"use client"`).
- [x] Use a Shadcn `Card` with a subtle Glassmorphism background (e.g., `bg-white/5 backdrop-blur-md border-white/10`).
- [x] Add a welcoming Header: "Welcome to ChaseFree AI! Let's get you paid."

### 2. Implement the 3-Step Action Grid
Inside the banner, create a 3-column responsive grid (`grid-cols-1 md:grid-cols-3`):
- [x] **Card 1 (Add Client):**
  - Icon: Lucide `UserPlus`
  - Text: "Step 1: Add your first client"
  - Button: "Add Client" (Links to `/clients` or opens client modal).
- [x] **Card 2 (Create Invoice):**
  - Icon: Lucide `FileText`
  - Text: "Step 2: Create a professional invoice"
  - Button: "Create Invoice" (Links to `/invoices/new`).
- [x] **Card 3 (Chase Payments):**
  - Icon: Lucide `Sparkles` or `Bot`
  - Text: "Step 3: Let AI chase your payments"
  - Info text: "Generates polite follow-ups automatically."

### 3. Conditional Rendering (Empty State Logic)
- [x] In the main Dashboard page (`src/app/(dashboard)/page.tsx` or similar), fetch the user's total invoice count from Supabase.
- [x] **CRITICAL:** Render the `QuickStartBanner` ONLY if the user has **0 invoices**.
- [x] If they have 1 or more invoices, DO NOT show the banner (show the normal revenue charts/tables instead).

### 4. Version Control
- [x] Run `git add .`
- [x] Run `git commit -m "feat(v2): add quick start banner for empty dashboard state"`

**Note for Open Claude:** You must strictly follow this checklist. Pay special attention to the UI styling (it must look premium) and the conditional rendering logic. Mark checkboxes [x] when finished.
