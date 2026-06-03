---
tags: [components, ui, shadcn]
created: 2026-05-31
---

# UI Components

## Overview
shadcn/ui component library - 103 nodes, most connected component system.

## Location
`src/components/ui/`

## Key Components
| Component | File | Purpose |
|-----------|------|---------|
| Button | `button.tsx` | Primary action button |
| Card | `card.tsx` | Content container |
| Dialog | `dialog.tsx` | Modal dialogs |
| Input | `input.tsx` | Text input |
| Select | `select.tsx` | Dropdown select |
| Badge | `badge.tsx` | Status badges |
| Avatar | `avatar.tsx` | User avatars |
| Toast | `toast.tsx` | Notifications |
| Dropdown Menu | `dropdown-menu.tsx` | Context menus |
| Sheet | `sheet.tsx` | Slide-out panels |

## Design System
- **Glassmorphism** aesthetic
- Dark/light mode support
- Tailwind CSS 4.3.0
- CSS variables for theming

## Utility Function
**File:** `src/lib/utils.ts`
- `cn()` - 86 edges (most connected node!)
- Merges Tailwind classes with `clsx` + `tailwind-merge`

## Related Notes
- [[Architecture Overview]]
- [[Dashboard Components]]
- [[Invoice Components]]
