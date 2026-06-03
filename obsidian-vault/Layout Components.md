---
tags: [components, layout]
created: 2026-05-31
---

# Layout Components

## Overview
Application shell and navigation components.

## Location
`src/components/layout/`

## Components

### DashboardLayout
- Sidebar + main content area
- Sidebar hover expand
- Mobile responsive (partially)
- `src/app/(dashboard)/layout.tsx`

### Sidebar
- Navigation links
- Active state highlighting
- Collapsed/expanded states

### AuthLayout
- Centered card layout
- Background animation
- `src/app/(auth)/layout.tsx`

## Navigation Config
**File:** `src/config/nav.ts`
- Route definitions
- Icon mappings
- Active state logic

## Related Notes
- [[Architecture Overview]]
- [[Dashboard Domain]]
- [[UI Components]]
