# app-flow.md

## Purpose
This document defines the main user flows for ChaseFree AI V1.

Goal:
- keep the app focused
- reduce user confusion
- make invoice chasing feel simple
- define what happens on each key screen
- guide routing, state, and UI priorities

This is not a wireframe document.

This is a product flow document.

---

## Product Flow Principle
The app should help the user answer these questions quickly:
- Who owes me money?
- What is overdue?
- Who should I chase today?
- What should I send?
- What already happened before?

Every important screen should support one of these answers.

---

## Main Navigation
V1 main app navigation:
- Dashboard
- Clients
- Invoices
- Settings

Optional:
- Onboarding
- AI Settings inside Settings
- Import flow inside Invoices

Do not create too many top-level sections.

---

## Route Structure
Suggested route structure:

- `/sign-in`
- `/sign-up`
- `/onboarding`
- `/dashboard`
- `/clients`
- `/clients/[clientId]`
- `/invoices`
- `/invoices/[invoiceId]`
- `/settings`
- `/settings/ai`

Keep routing simple.

---

## Global App Rules
- All protected routes require auth
- After login, user lands on onboarding if setup is incomplete
- Otherwise user lands on dashboard
- Dashboard is the main daily-use screen
- “Who to Chase Today” is the main product action area
- AI generation should always happen from meaningful invoice context
- No blind AI generation from empty screens

---

## Flow 1: New User Onboarding

### Goal
Help the user reach first value quickly.

### Steps
1. User signs up
2. Profile row is created
3. User lands on onboarding
4. User sees short intro
5. User adds first client
6. User adds first invoice
7. User is shown dashboard
8. If invoice is due soon or overdue, user can generate first reminder

### Onboarding Screens
Suggested onboarding steps:
- Welcome
- Add first client
- Add first invoice
- Optional AI settings prompt
- Finish and go to dashboard

### Onboarding Rules
- Keep onboarding short
- Skip anything not needed for first value
- Do not force long settings forms
- AI settings can be deferred if needed, but remind user before first generation

---

## Flow 2: Daily User Flow

### Goal
This is the most important recurring flow.

### Steps
1. User opens app
2. Lands on dashboard
3. Scans summary metrics
4. Checks “Who to Chase Today”
5. Opens a target invoice
6. Reviews invoice details and reminder history
7. Clicks generate reminder
8. Selects tone
9. Reviews AI draft options
10. Copies or edits one
11. Sends manually outside app
12. Optionally marks reminder as sent
13. Returns to dashboard or next invoice

### UX Priority
This must feel fast, low-friction, and obvious.

---

## Flow 3: Client Creation Flow

### Entry Points
User can create a client from:
- onboarding
- clients page
- invoice create form
- empty state CTA

### Steps
1. User clicks add client
2. Opens dialog or full page form
3. Fills basic details
4. Saves client
5. Returns to previous context

### Required Fields
- client name

### Optional Fields
- contact name
- email
- phone
- company name
- notes

### UX Rule
If user is creating a client from invoice flow, return them back to invoice creation immediately after save.

---

## Flow 4: Invoice Creation Flow

### Entry Points
User can create invoice from:
- onboarding
- dashboard CTA
- invoices page
- client detail page

### Steps
1. User clicks add invoice
2. Opens invoice form
3. Selects client
4. Adds invoice details
5. Saves invoice
6. Lands on invoice detail page or invoice list
7. If invoice needs action, show generate reminder CTA

### Required Fields
- client
- invoice number
- title
- issue date
- due date
- amount

### Optional Fields
- description
- payment link
- notes
- currency if not using default

---

## Flow 5: Dashboard Flow

### Goal
Give the user immediate financial follow-up clarity.

### Dashboard Sections
1. Summary cards
2. Who to Chase Today
3. Recent invoices
4. Recent reminder activity

### Expected User Actions
From dashboard user should be able to:
- open invoice detail
- generate reminder
- mark paid
- view all invoices
- view all clients

### Dashboard Priority Order
Most important:
1. Who to Chase Today
2. Overdue summary
3. Recent invoices
4. Reminder history

### UX Rule
Dashboard should feel like an action center, not an analytics page.

---

## Flow 6: Who to Chase Today

### Goal
Remove decision fatigue.

### Trigger Logic
This section should include invoices that are:
- due soon
- due today
- overdue
- not paid
- not archived

Prioritization should consider:
- overdue days
- last reminder date
- reminder count

### Card / Row Actions
Each item should support:
- open invoice
- generate reminder
- mark paid

### UX Rule
This section should make the next action obvious in one glance.

---

## Flow 7: Invoices List Flow

### Goal
Allow structured browsing and filtering.

### Features
- search
- filter by status
- sort by due date
- sort by amount
- sort by created date
- row actions
- pagination if needed

shadcn/ui data table guidance shows that sorting, filtering, pagination, row actions, and row selection are meant to be composed for the app’s specific use case, which fits the invoice list well.[cite:73]

### Row Click Behavior
Preferred behavior:
- clicking row opens invoice detail
- action menu handles secondary actions

### Important Row Actions
- view invoice
- generate reminder
- mark paid
- edit invoice
- archive invoice

---

## Flow 8: Invoice Detail Flow

### Goal
This is the context hub for follow-up action.

### Page Sections
- invoice summary
- client info
- payment status
- due/overdue indicator
- payment link if available
- reminder history
- AI reminder generator area

### Main CTA
Primary CTA:
- Generate Reminder

Secondary CTAs:
- Edit invoice
- Mark paid
- Copy payment link
- Archive

### UX Rule
The user should not need to leave this page to understand what happened and what to do next.

---

## Flow 9: AI Reminder Generation Flow

### Goal
Generate useful drafts using invoice context plus history.

### Steps
1. User opens invoice detail
2. Clicks generate reminder
3. Tone selector opens
4. Optional instruction can be added
5. User clicks generate
6. Loading state appears
7. Server fetches invoice + client + reminder history
8. AI returns structured drafts
9. UI displays 2 to 3 options
10. User copies or edits one
11. Draft event is saved
12. Copy / sent actions can be tracked

### Required Context
- invoice details
- client details
- reminder count
- last reminder
- recent reminder history
- selected tone

### UX Rules
- Never generate from empty context
- Never auto-send
- Always show history nearby
- Always keep user in control

---

## Flow 10: Reminder History Flow

### Goal
Show continuity so follow-up is not blind.

### What User Should See
- generated drafts
- tone used
- created time
- copied or not
- marked sent or not

### Why It Matters
This helps the user:
- avoid repeating messages
- choose better escalation
- understand what happened previously

---

## Flow 11: Mark Paid Flow

### Entry Points
- dashboard
- invoice list row action
- invoice detail page

### Steps
1. User clicks mark paid
2. Small confirmation opens
3. Optional paid date can be adjusted
4. Save updates invoice status
5. Invoice is removed from chase list
6. Event is recorded

### UX Rule
This action should be quick and safe.

---

## Flow 12: CSV Import Flow

### Goal
Help existing users migrate quickly.

### Steps
1. User goes to invoices page
2. Clicks import CSV
3. Uploads file
4. System parses rows
5. User reviews parsed preview
6. Valid rows are imported
7. Errors are shown clearly
8. User lands back on invoices list

### UX Rules
- Keep mapping simple in V1
- Avoid complex import wizard
- Show row-level errors clearly
- Never silently drop broken rows

---

## Flow 13: Settings Flow

### Main Sections
- profile
- default currency
- AI settings

### AI Settings Flow
1. User opens settings
2. Opens AI settings
3. Adds provider label
4. Adds base URL
5. Adds model name
6. Adds API key
7. Tests connection
8. Saves settings

### UX Rule
AI settings should be easy enough for technical users but not scary.

---

## Flow 14: Empty States

### Dashboard Empty State
If no invoices:
- explain what ChaseFree does
- CTA: add first invoice

### Clients Empty State
- CTA: add first client

### Invoices Empty State
- CTA: create invoice
- secondary CTA: import CSV

### Reminder Empty State
If no reminders yet:
- explain that generated drafts will appear here
- CTA: generate first reminder

### UX Rule
Every empty state must lead to an action.

---

## Flow 15: Error States

### Common Error Cases
- AI settings missing
- AI provider timeout
- invalid invoice form
- unauthorized access
- CSV parse failure

### UX Rules
- show simple message
- keep user context
- allow retry
- do not wipe form state
- never show raw technical dumps to normal users

---

## Mobile Flow Rules
- dashboard sections should stack clearly
- who-to-chase cards should stay readable
- invoice table may collapse into cards on smaller screens
- primary actions should stay easy to tap
- AI draft options should be scrollable and easy to copy

shadcn/ui table patterns support composing sorting, filtering, selection, and pagination behavior, but mobile UX should simplify presentation where a full dense grid becomes hard to use.[cite:73]

---

## Primary CTA Rules
Each main screen should have one dominant action.

Suggested:
- Dashboard → Review who to chase today
- Clients → Add client
- Invoices → Add invoice
- Invoice Detail → Generate reminder
- Settings AI → Save / test AI config

Do not place too many equal-priority buttons on the same screen.

---

## State Completion Rules
A user should feel progression through these milestones:
1. Signed in
2. First client added
3. First invoice added
4. First reminder generated
5. First invoice marked paid

These are the core activation milestones.

---

## Final Agent Instruction
Build ChaseFree AI V1 around these primary flows:

- onboarding to first value
- dashboard as action center
- who-to-chase-today as core differentiator
- invoice detail as reminder context hub
- AI generation as structured human-in-the-loop assistance
- settings only as much as necessary

Do not design the app as a generic admin panel.

Design it as a focused workflow product that helps freelancers chase unpaid invoices with less stress and more clarity.