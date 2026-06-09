---
tags: [domain, reminders, ai]
created: 2026-05-31
---

# Reminders Domain

## Overview
AI-powered payment reminder system with tone escalation and activity tracking.

## Tone Escalation
```
gentle → firm → urgent → final
```

| Tone | Use Case |
|------|----------|
| `gentle` | First reminder, invoice just due |
| `firm` | 7+ days overdue |
| `urgent` | 14+ days overdue |
| `final` | 30+ days overdue, last resort |

## Pages
| Page | Path | Purpose |
|------|------|---------|
| Reminders | `/reminders` | Reminder history and generation |

## Server Actions
**File:** `src/lib/reminders/actions.ts`

| Function | Purpose |
|----------|---------|
| `generateReminderAction()` | Generate single AI reminder |
| `generateMultipleDraftsAction()` | Generate multiple tone variants |
| `getReminderHistoryAction()` | Get reminder history for invoice |
| `logReminderEventAction()` | Log reminder event |
| `sendReminderAction()` | Send reminder to client |

## Components
**File:** `src/components/reminders/activity-timeline.tsx`
- `ActivityTimeline()` - Visual timeline of reminder events
- `EVENT_META` - Event type metadata
- `formatRelativeTime()` - Time formatting

## Cron Job
**File:** `src/app/api/cron/reminders/route.ts`
- Automated reminder sending
- Runs on schedule (configurable)
- Checks invoice due dates
- Sends appropriate tone based on overdue duration

## AI Integration
- Uses Google Gemini (configurable)
- Temperature control for tone variation
- Context-aware prompts with invoice details
- `src/lib/settings/actions.ts` - AI settings management

## Related Notes
- [[Architecture Overview]]
- [[Invoices Domain]]
- [[Settings Domain]]
