---
tags: [domain, dashboard, core]
created: 2026-05-31
---

# Dashboard Domain

## Overview
The main workspace after login. Shows urgency-aware invoice list, quick actions, and AI-powered chase recommendations.

## Key Features

### "Who to Chase Today"
- Invoices sorted by urgency (overdue first, then by days until due)
- `getDueInterpretation()` - Calculates urgency level
- `getFollowupRecommendation()` - AI suggestion for next action
- `getInvoiceEffectiveStatus()` - Considers due dates vs current status

### Visual Customizer
- Theme presets (light/dark/custom)
- localStorage persistence
- `src/app/(dashboard)/dashboard/visual-customizer.tsx`

### Global Search
- Searches across clients, invoices, and settings
- Debounced input with race condition protection
- `src/components/dashboard/GlobalSearch.tsx`

### Notification Bell
- Real-time notification display
- Mark as read/clear all
- `src/components/dashboard/NotificationBell.tsx`

### Unbilled Scratchpad
- Quick capture for unbilled work items
- Convert to invoice workflow
- `src/components/dashboard/UnbilledScratchpad.tsx`

## Server Actions
**File:** `src/lib/dashboard/actions.ts`

| Function | Purpose |
|----------|---------|
| `getDashboardData()` | Aggregated dashboard stats |
| `getNotifications()` | User notifications |
| `markNotificationRead()` | Mark single notification |
| `clearAllNotifications()` | Clear all notifications |

## Layout
**File:** `src/app/(dashboard)/layout.tsx`
- `DashboardLayout()` - Sidebar + main content
- Sidebar navigation with hover expand
- `UserNav()` - Profile menu

## Related Notes
- [[Architecture Overview]]
- [[Invoices Domain]]
- [[Clients Domain]]
- [[Dashboard Components]]
