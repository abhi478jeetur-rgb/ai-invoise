---
tags: [components, dashboard]
created: 2026-05-31
---

# Dashboard Components

## Overview
Components specific to the dashboard workspace.

## Location
`src/components/dashboard/`

## Components

### GlobalSearch
**File:** `GlobalSearch.tsx`
- Searches across clients, invoices, settings
- Debounced input
- Keyboard shortcut (Cmd+K)
- Race condition protection on rapid queries

### NotificationBell
**File:** `NotificationBell.tsx`
- Real-time notification display
- Mark as read
- Clear all notifications
- Badge count

### PageTitle
**File:** `PageTitle.tsx`
- Dynamic page title
- Breadcrumb support

### UserNav
**File:** `UserNav.tsx`
- User avatar dropdown
- Profile, settings, logout links

### UnbilledScratchpad
**File:** `UnbilledScratchpad.tsx`
- Quick capture for unbilled work
- Convert to invoice
- Optimistic updates

## Related Notes
- [[Dashboard Domain]]
- [[UI Components]]
