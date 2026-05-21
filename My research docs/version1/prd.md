# PRD.md

## Product Name
ChaseFree AI

## One-Line Product Definition
ChaseFree AI is an AI-powered invoicing and payment follow-up assistant for solo freelancers and small agencies that helps them track unpaid invoices and generate perfectly toned reminder emails without damaging client relationships.

## Product Vision
Build a focused invoicing software for freelancers and small agencies that removes the emotional stress, awkwardness, and procrastination involved in chasing late payments.

This is not a full accounting suite, ERP, bookkeeping tool, payroll product, or tax platform.

The core value is:
- Know who owes you money
- Know who to chase today
- Generate the right follow-up message instantly
- Protect both cash flow and client relationships

## Primary Target User
### Core Segment
- Solo freelancers
- Independent contractors
- Small or micro-agencies

### Typical Professions
- Web developers
- Designers
- Writers
- Consultants
- Creative producers
- Small service businesses

### Why This Segment
These users usually:
- Have inconsistent cash flow
- Do not have an accounts receivable department
- Hate sounding rude while asking for money
- Delay follow-ups because of emotional discomfort
- Use scattered tools like spreadsheets, docs, email drafts, and calendar reminders
- Need something simpler than full accounting software

## Core User Problem
Freelancers and small agencies often do not struggle mainly with creating an invoice.

They struggle with:
- remembering which invoices are unpaid
- knowing when to follow up
- deciding what tone to use
- writing awkward follow-up emails
- protecting the client relationship while still collecting money

## Main Problem We Solve in V1
The awkwardness and anxiety of chasing late payments.

## Product Positioning
For solo freelancers and small agencies who struggle with the emotional stress of chasing late payments, ChaseFree AI is a smart invoicing and follow-up assistant that tracks unpaid invoices and drafts tailored reminder emails with the right tone.

## Product Category
AI-first invoicing software with payment follow-up assistance.

More specifically:
- not a generic CRM
- not a bookkeeping suite
- not a payment processor
- not a project management tool

It is a focused invoicing workflow product centered on invoice tracking + reminder generation.

## Product Principles
- Focused over bloated
- Fast to use
- Emotionally helpful, not robotic
- Human-in-the-loop, never fully autonomous in V1
- Designed for non-finance users
- Minimal manual effort
- Clear urgency visibility
- Strong UX for trust and clarity
- Modular AI provider support using OpenAI-compatible APIs

## V1 Goals
### Business Goal
Ship a narrow, highly useful MVP that solves one painful, frequent, emotionally charged problem for freelancers: chasing unpaid invoices.

### User Goal
Help the user quickly answer:
- Who owes me money?
- Which invoices are overdue?
- Who should I follow up with today?
- What should I say?
- How firm should I sound?

### Product Goal
Allow a user to:
1. Add or import invoices
2. Track invoice status and due dates
3. See urgency at a glance
4. Open an invoice and generate reminder drafts
5. Copy or use a simple email integration
6. Maintain a reminder history

## Non-Goals for V1
Do NOT build these in V1:
- Double-entry accounting
- General ledger
- Full bookkeeping
- Payroll
- Tax filing
- Advanced tax compliance
- Deep bank-feed reconciliation
- Full CRM sales pipeline
- Project management
- Time tracking
- Automated email sending without review
- Legal claims / legal filing automation
- Complex payment gateway workflows
- Subscription billing
- Team-heavy enterprise permission systems
- Multi-entity accounting
- Full ERP features

## Success Criteria for V1
A V1 is successful if a freelancer can:
- create an account
- add a client
- add an invoice
- see whether it is due or overdue
- open “Who to Chase Today”
- generate 2 to 3 reminder drafts
- copy and send a reminder manually
- feel less stress about following up

## Core Product Pillars
### 1. Invoice Tracking
The user must be able to clearly track what is unpaid, due soon, overdue, or paid.

### 2. Follow-Up Guidance
The product should tell the user who to chase today and why.

### 3. AI Reminder Drafting
The product should generate tailored reminders with different tones based on invoice status and delay.

### 4. Relationship Protection
The product should help the user sound professional, calm, and context-aware instead of rude, desperate, or robotic.

## User Stories
### Account and Setup
- As a freelancer, I want to sign up quickly so I can start tracking invoices.
- As a freelancer, I want to log in securely so my invoice information stays private.
- As a freelancer, I want simple onboarding so I understand how the product works.

### Client Management
- As a user, I want to add clients so I can attach invoices to the correct people.
- As a user, I want to store basic client details such as company name, contact name, email, and notes.
- As a user, I want to view all invoices for a specific client.

### Invoice Tracking
- As a user, I want to create invoices manually so I can start tracking payments immediately.
- As a user, I want to import invoices through CSV so I do not have to enter everything one by one.
- As a user, I want to set issue date, due date, amount, status, and payment link.
- As a user, I want invoice statuses to be visually obvious.
- As a user, I want to see overdue invoices first.

### Chasing Workflow
- As a user, I want a “Who to Chase Today” view so I do not need to think about follow-up timing.
- As a user, I want invoice urgency to be grouped by due soon, overdue, and severely overdue.
- As a user, I want to know when the last reminder was generated or sent.

### AI Reminder Drafting
- As a user, I want to choose a tone such as friendly, professional, firm, or final notice.
- As a user, I want the AI to generate multiple reminder versions.
- As a user, I want drafts to reflect the days overdue.
- As a user, I want the message to feel natural and relationship-safe.
- As a user, I want to copy the draft quickly and send it myself.

### Trust and Review
- As a user, I do not want emails to be auto-sent without my review.
- As a user, I want to see generated draft history for each invoice.
- As a user, I want to edit AI drafts before sending them.

## Functional Scope for V1

### A. Authentication
Use Supabase Auth.

Support:
- Email/password
- Magic link if convenient
- Session handling
- Protected dashboard routes

Do not overbuild auth.

### B. Dashboard
Main dashboard must answer:
- total unpaid amount
- overdue amount
- invoices due this week
- clients to chase today
- reminders recently generated

Main sections:
- Top summary cards
- “Who to Chase Today”
- Recent invoices
- Recent reminder activity

### C. Clients
Each client should contain:
- client name
- contact person
- email
- optional phone
- company name
- notes
- preferred tone or relationship notes (optional later)
- created at
- updated at

### D. Invoices
Each invoice should contain:
- client reference
- invoice number
- title or short description
- issue date
- due date
- amount
- currency
- status
- payment link (optional)
- notes
- last reminder date
- reminder count
- created at
- updated at

### E. Invoice Status System
Statuses for V1:
- Draft
- Sent
- Due Soon
- Overdue
- Paid
- Archived

Derived urgency states may include:
- due in 3 days
- due today
- overdue 1 to 3 days
- overdue 4 to 7 days
- overdue 8 to 14 days
- overdue 15+ days

These urgency states should drive dashboard visibility and AI suggestion logic.

### F. Who to Chase Today
This is a core V1 feature.

The system should show a prioritized list of invoices needing attention today.

Prioritization should consider:
- due date proximity
- overdue days
- whether reminder was recently generated
- whether invoice is already paid
- reminder count

Each list item should show:
- client name
- invoice title or number
- amount
- due date
- days overdue or due soon label
- quick action button: Generate Reminder

### G. AI Reminder Draft Generator
The AI draft generator must:
- accept invoice context
- accept client name
- accept due date and overdue duration
- accept amount
- accept tone selection
- generate 2 to 3 reminder variants
- keep language concise and professional
- avoid sounding robotic
- avoid legal threats unless explicitly part of a later advanced feature
- support human review before use

Tone presets for V1:
- Friendly Nudge
- Professional Reminder
- Firm Deadline
- Final Notice

Draft generation output should include:
- subject line
- email body
- optional short follow-up version

### H. Copy / Email Handoff
For V1:
- Copy to clipboard is mandatory
- Simple open-in-email flow is optional
- Gmail/Outlook integration can be basic and limited if added
- No autonomous sending in V1

### I. Draft and Reminder History
For each invoice store:
- generated draft records
- timestamp
- tone used
- selected version
- whether copied
- optional sent manually flag

### J. CSV Import
Minimal CSV import should support:
- client name
- invoice number
- amount
- due date
- status
- email if available

CSV import can be basic in V1 but should not be broken.

### K. Settings
Settings page should include:
- profile info
- default currency
- AI provider selection
- AI model name
- OpenAI-compatible base URL
- API key input
- default tone preference
- optional reminder cadence defaults later

## AI Provider Requirements
The app must support OpenAI-compatible providers.

Initial expected providers:
- Groq
- Nvidia-compatible OpenAI-style endpoints
- other OpenAI-compatible providers later

AI architecture must be provider-agnostic.

Required configuration:
- provider label
- base URL
- model
- API key
- optional temperature/max tokens

The AI layer must be abstracted behind a service so providers can be swapped without changing product logic.

## Recommended Tech Stack
- Next.js
- TypeScript
- React
- Tailwind CSS
- shadcn/ui
- Supabase
- Postgres via Supabase
- OpenAI-compatible API integration layer

## Frontend Guidelines
### UI Philosophy
The UI should feel:
- calm
- clean
- professional
- modern
- trustworthy
- lightweight
- not cluttered
- not template-looking
- not generic AI purple-glow SaaS

### Design Approach
Use:
- custom product UI
- shadcn/ui primitives and components as a base
- custom theming
- custom layouts
- custom variants for invoice urgency, tone, and follow-up workflow

Do NOT rely only on default shadcn appearance.

### UI Requirements
- Fast dashboard scanning
- Clear hierarchy
- Strong empty states
- Accessible forms
- Good table usability
- Strong mobile responsiveness
- Visual clarity for urgency
- Clean dialog and drawer patterns
- Minimal friction in reminder generation flow

### shadcn/ui Usage Strategy
Use shadcn/ui for:
- button
- input
- textarea
- dialog
- dropdown menu
- select
- card
- tabs
- table
- badge
- tooltip
- toast if needed
- sheet/drawer
- form primitives
- calendar/date picker if needed

Then build custom components on top such as:
- InvoiceStatusBadge
- UrgencyCard
- ChaseTodayList
- ReminderToneSelector
- DraftOptionCard
- DashboardSummaryCard
- ClientHealthPanel

## Backend Guidelines
Use Supabase for:
- authentication
- database
- row-level security
- server-side access patterns
- optional storage later

Avoid unnecessary backend complexity in V1.

## Suggested Data Model

### profiles
- id
- email
- full_name
- created_at
- updated_at

### clients
- id
- user_id
- client_name
- contact_name
- email
- phone
- company_name
- notes
- created_at
- updated_at

### invoices
- id
- user_id
- client_id
- invoice_number
- title
- description
- issue_date
- due_date
- amount
- currency
- status
- payment_link
- notes
- last_reminder_at
- reminder_count
- paid_at
- created_at
- updated_at

### reminder_drafts
- id
- user_id
- invoice_id
- tone
- provider
- model
- subject
- body
- short_version
- was_copied
- was_marked_sent
- created_at

### reminder_events
- id
- user_id
- invoice_id
- event_type
- metadata_json
- created_at

## Key Screens
### 1. Auth
- Sign in
- Sign up
- Optional magic link

### 2. Onboarding
- Welcome
- Add first client
- Add first invoice
- Generate first reminder

### 3. Dashboard
- Summary metrics
- Who to Chase Today
- Recent invoices
- Recent reminder activity

### 4. Clients List
- Search
- Filter
- Add client

### 5. Client Detail
- Client info
- Associated invoices
- Notes
- Quick reminder context

### 6. Invoices List
- Search
- Filter by status
- Sort by due date
- Create invoice
- Import CSV

### 7. Invoice Detail
- Invoice information
- Timeline
- Reminder history
- Generate reminder CTA

### 8. Reminder Generator
- Tone selector
- Draft variants
- Copy action
- Save history

### 9. Settings
- Profile
- Currency
- AI provider config
- Model config

## Core Flows

### Flow 1: New User First Success
1. User signs up
2. User lands on onboarding
3. User creates first client
4. User creates first invoice
5. System shows dashboard
6. User can generate first reminder draft

### Flow 2: Daily Chase Workflow
1. User opens dashboard
2. User checks “Who to Chase Today”
3. User opens invoice
4. User selects tone
5. AI generates drafts
6. User copies one
7. User sends email manually
8. User marks reminder as handled if needed

### Flow 3: Import Existing Data
1. User uploads CSV
2. System validates rows
3. User reviews parsed data
4. User imports invoices
5. Dashboard updates

## Product Logic Rules
- Paid invoices should never appear in “Who to Chase Today”
- Recently reminded invoices should not be over-prioritized immediately again
- Reminder generation must be tied to invoice context
- Users must always review content before sending
- Empty states must help the user take the next action
- Overdue invoices must be visually prioritized over neutral items
- The app must stay focused on receivables follow-up, not become a general admin suite

## Tone Rules for AI
The AI should generate drafts that are:
- concise
- professional
- natural
- respectful
- emotionally intelligent
- easy to copy and send

The AI should avoid:
- robotic wording
- fake empathy
- overly long messages
- legal intimidation by default
- aggressive accusations
- unnecessary complexity

## UX Constraints
- The app must be easy for non-finance people
- Most actions should be achievable in a few clicks
- The dashboard should be usable within seconds
- The reminder generation experience should feel lightweight
- The product should reduce decision fatigue, not add more forms and settings

## Security / Privacy Expectations
- Users can only access their own data
- Supabase RLS must be implemented
- API keys must be handled securely
- Sensitive config must not leak to the client
- Audit basic access paths
- Do not expose private invoice data across users

## Performance Expectations
- Fast dashboard load
- Good form responsiveness
- Stable tables and filtering
- No bloated dependencies unless necessary
- Avoid heavy animations and unnecessary frontend complexity

## What Makes This Product Different
This product is different from traditional invoicing software because it is centered on payment follow-up, not just invoice creation.

This product is different from CRM software because it does not focus on sales pipeline management.

Its key differentiation is:
- emotional painkiller for awkward collections
- AI-generated tone-aware reminders
- who-to-chase-today workflow
- simple freelancer-focused invoicing experience

## MVP Release Checklist
The MVP should not launch until these work reliably:
- auth
- add client
- add invoice
- invoice list
- due/overdue state logic
- dashboard summary
- who to chase today list
- reminder generation
- copy draft
- reminder history
- basic settings for AI provider

## Future Features After V1
Possible later features:
- Gmail integration
- Outlook integration
- smart reminder cadence
- reply-aware pause logic
- richer client communication memory
- payment link suggestions
- invoice quality checker
- contract-based late fee assistant
- bank reconciliation assistance
- mobile app
- team collaboration
- payment gateway integrations
- deeper analytics

## Explicit Build Instruction for Agent
Build ChaseFree AI as a focused AI-first invoicing software for freelancers and small agencies.

Do not drift into:
- full accounting software
- CRM pipeline software
- project management software
- enterprise ERP features

Prioritize:
- clean architecture
- stable UI
- shadcn/ui as primitives, not final design
- custom product-specific components
- Supabase backend
- Next.js app structure
- strong invoice and reminder workflows
- OpenAI-compatible provider abstraction
- excellent UX for the “Who to Chase Today” and reminder generation flows

## Final Product Definition
ChaseFree AI is a modern invoicing software focused on helping freelancers and small agencies track unpaid invoices and generate high-quality AI follow-up reminders with the right tone, at the right time, with minimal friction.