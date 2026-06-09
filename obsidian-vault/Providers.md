---
tags: [providers, config]
created: 2026-05-31
---

# Providers

## Overview
React context providers for app-wide state.

## Location
`src/providers/`

## Providers

### ThemeProvider
**File:** `theme-provider.tsx`
- Dark/light mode toggle
- CSS variable management
- localStorage persistence

### PostHogProvider
**File:** `posthog-provider.tsx`
- Analytics tracking
- User identification
- Event capture

## App Wrapper
**File:** `src/app/layout.tsx`
```
<ThemeProvider>
  <PostHogProvider>
    <Toaster />
    {children}
  </PostHogProvider>
</ThemeProvider>
```

## Related Notes
- [[Architecture Overview]]
- [[UI Components]]
