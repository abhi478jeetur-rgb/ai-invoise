# better-ui-design.md

## Document Purpose
This document defines the front-end UI/UX direction for ChaseFree AI.

The goal is to make the product feel:
- clean
- modern
- premium
- focused
- calm
- highly readable
- easy to scan
- easy to understand
- dark mode and light mode ready
- visually consistent with a high-quality shadcn/ui-based product

This document is for the frontend agent or builder.

It should be treated as a strict design and UX direction document for V1.

---

## Product UI Intent
ChaseFree AI should look like a focused modern financial workflow product, not like a generic AI dashboard, noisy SaaS starter, or overly flashy startup landing page.

The interface should feel:
- serious but not intimidating
- premium but not luxurious
- minimal but not empty
- data-aware but not spreadsheet-heavy
- smart but not robotic
- elegant but highly practical

The user should immediately understand:
- who owes money
- what needs attention today
- what is overdue
- what action should be taken next
- how to generate a follow-up draft quickly

---

## Reference Design Direction
The UI reference style should follow these qualities:

- dark neutral surfaces
- soft contrast
- thin borders
- calm spacing
- restrained accent colors
- modular dashboard cards
- elegant typography
- quiet interface chrome
- visually grouped actions
- high readability
- very low visual noise

The interface should resemble a clean operating system for unpaid invoices and follow-ups.

Do NOT make the UI look:
- too colorful
- too “AI-generated”
- too glossy
- too rounded everywhere
- too crowded
- too card-heavy without hierarchy
- too much like a CRM pipeline
- too much like accounting software from the 2010s
- too enterprise-bloated
- too playful

---

## Overall Design Principles

### 1. Clarity Over Decoration
Every visual element must help the user understand data or take action.

Avoid decorative clutter.

No unnecessary gradients, blobs, glow effects, floating shapes, or bright accent overload.

### 2. One Clear Action at a Time
Every screen should communicate the next logical action clearly.

The user should never feel lost about:
- what they are looking at
- what they can do
- what they should do next

### 3. Minimal but Warm
The UI should be minimal, but not cold or lifeless.

Use spacing, type hierarchy, and soft surfaces to create warmth instead of decoration.

### 4. Scannability First
This product is about unpaid invoices and reminders.

The UI must make scanning easy:
- status should be instantly visible
- urgency should be instantly visible
- next action should be instantly visible

### 5. Consistent Structure
Pages should connect naturally through consistent layout patterns, navigation, cards, spacing, and terminology.

---

## Visual Style

### Theme Style
Use a refined dark and light theme system.

#### Dark Mode
Dark mode should be the premium flagship look:
- very dark neutral background
- slightly elevated card surfaces
- low-glare borders
- soft text contrast
- white or near-white headings
- muted secondary text
- limited accents for urgency and actions

#### Light Mode
Light mode should feel clean and professional:
- warm off-white or neutral light background
- subtle layered surfaces
- soft borders
- dark readable text
- minimal harsh contrast

### Accent Strategy
Accent color use should be restrained.

Recommended accent usage:
- primary action buttons
- selected tabs
- focus rings
- selected filter states
- small highlight moments

Urgency/status colors should be used carefully:
- green for paid/safe
- amber for due soon
- red for overdue or high urgency
- blue/neutral for info or draft states

Do not overuse colors across every component.

---

## Typography
Typography should feel elegant, modern, and highly readable.

### Rules
- clear large page heading
- short subtitle under page heading where needed
- compact labels
- readable table text
- readable card text
- avoid giant SaaS hero headings inside app pages
- avoid too many font sizes
- use strong hierarchy without visual chaos

### Suggested Tone
- one modern body font
- one refined display or heading font if needed sparingly
- body text should stay highly readable
- page headings can feel more premium
- table and form text should remain simple

### Typography Behavior
Use typography to communicate:
- page importance
- metric importance
- status hierarchy
- action hierarchy

Do not rely only on color for importance.

---

## Layout System

### App Shell
The product should use a structured app shell.

Desktop layout:
- left sidebar navigation
- top bar or page toolbar
- main content area
- optional right-side contextual panel only where necessary

Mobile/tablet layout:
- collapsible sidebar or sheet navigation
- fixed top bar
- stacked content
- simplified filters and controls

### Spacing
Spacing should feel intentional and breathable.

Use:
- generous page padding
- moderate card gaps
- tight internal spacing for dense data
- consistent section rhythm

Avoid:
- cramped layouts
- oversized empty gaps
- random spacing differences
- too many nested containers

### Content Width
Do not stretch content awkwardly across the full screen unless it is a table or wide dashboard area.

Use structured max-widths where appropriate.

---

## Core Navigation

### Main Sidebar Nav for V1
Use a clean icon + label sidebar.

Main items:
- Dashboard
- Clients
- Invoices
- Reminders or Drafts
- Import
- Settings

Optional:
- Search
- Help / Docs

Do NOT include in V1:
- Deals
- CRM pipeline
- Projects
- Team management
- Analytics overload
- Billing plans
- Advanced reporting sections
- Payments dashboard
- Tax center

### Sidebar Behavior
- Active item must be visually obvious
- Hover states should be subtle
- Icons should be clean and minimal
- Sidebar must work in dark and light mode
- On smaller screens, sidebar becomes a drawer/sheet

---

## Top Bar / Page Header
Each major page should have a clean header area.

Typical contents:
- page title
- short one-line context or subtitle
- page-level actions
- search or filter when needed
- theme toggle
- user menu

Do not overload the header.

Only include actions that matter for that page.

Examples:
- Dashboard: date range / quick filters / add invoice
- Invoices: search / status filter / add invoice / import CSV
- Client detail: edit client / add invoice
- Reminder generator: tone selector / generate drafts

---

## Design Tokens / UI Character

### Corners
Use moderate corner radius.

Do not make every surface extremely rounded.

### Borders
Use thin, subtle borders.

Borders should define structure, not dominate the UI.

### Shadows
Use shadows sparingly.

In dark mode, use surface contrast more than heavy shadows.

### Surfaces
Create a layered surface system:
- app background
- section background
- card surface
- elevated surface
- modal/drawer surface

These layers must be easy to distinguish without looking noisy.

---

## Component Design Direction

### Buttons
Buttons must feel crisp and stable.

Primary button:
- used for the main action
- clear but not overly bright

Secondary button:
- for lower-priority actions

Ghost button:
- for inline utility actions

Danger button:
- only where necessary

Avoid giant cartoonish buttons.

### Cards
Cards are important in this product.

Use cards for:
- summary metrics
- invoice urgency blocks
- chase-today items
- draft options
- onboarding steps
- empty states

Cards should be:
- clean
- structured
- aligned
- readable
- not overloaded with too many nested pills and micro-elements

### Tables
Invoice lists and client lists should use clean, readable data tables.

The table must support:
- search
- sort
- status filtering
- due date visibility
- quick row actions
- responsive adaptation

Table design priorities:
- readability first
- no overly dense rows
- clear row hover state
- status badges easy to scan
- due date and amount visually easy to compare

### Badges
Badges should be compact and meaningful.

Use badges for:
- status
- urgency
- tone
- imported/manual labels if needed

Badges should be visually clean, not too saturated.

### Inputs and Forms
Forms should feel easy, lightweight, and not like a tax-filing tool.

Use:
- clear labels
- helpful placeholders
- inline validation
- logical grouping
- short forms broken into sections if needed

Avoid:
- giant long forms
- too many fields at once
- unclear labels
- stacked complexity

### Dialogs / Sheets
Use dialogs and drawers for focused actions:
- add client
- add invoice
- edit invoice
- generate reminder
- import CSV

Do not overuse full-page redirections if a contained modal flow works better.

### Tabs
Tabs should be used sparingly and only where content is meaningfully grouped.

Good use:
- overview / activity / reminder history
- generated drafts / selected draft
- all invoices / overdue / paid

Avoid too many tabs in one screen.

---

## Status System UI
Invoice status must be visually obvious.

Core V1 statuses:
- Draft
- Sent
- Due Soon
- Overdue
- Paid
- Archived

Urgency presentation should be more important than administrative state.

Recommended urgency labels:
- Due in 3 days
- Due today
- 1–3 days overdue
- 4–7 days overdue
- 8–14 days overdue
- 15+ days overdue

UI rule:
Urgency should be visible in dashboard cards, tables, invoice detail pages, and chase lists.

---

## Dashboard Design for V1

### Dashboard Purpose
The dashboard is not a generic metrics wall.

It should answer:
- how much money is unpaid
- what is overdue
- who needs follow-up today
- what happened recently
- what should I do next

### Dashboard Sections
V1 dashboard should contain:

#### 1. Page Header
- greeting or dashboard title
- one-line summary
- quick action button: Add Invoice
- quick action button: Generate Reminder (optional if contextual)

#### 2. Summary Cards
Recommended cards:
- Total Unpaid
- Overdue Amount
- Due This Week
- Clients to Chase Today

Optional small trend indicator if useful, but do not fake analytics.

#### 3. Who to Chase Today
This is a primary panel and must be prominent.

Each item should show:
- client name
- invoice number or title
- amount
- due date
- overdue label
- quick action to generate reminder

This panel should feel like the heart of the product.

#### 4. Recent Invoice Activity
Show:
- newly added invoices
- recently updated invoices
- recently paid invoices if useful

#### 5. Recent Reminder Activity
Show:
- drafts generated
- tone used
- copied or marked handled
- last action time

### Dashboard Rules
- Do not create fake complexity
- Do not add charts unless truly useful
- Do not make it feel like a BI dashboard
- Do not overload with six different metric rows

---

## V1 Required Pages

### 1. Authentication
Pages:
- Sign in
- Sign up
- Optional password reset
- Optional magic link confirmation

Requirements:
- minimal
- clean
- fast
- not marketing-heavy

### 2. Onboarding
Goal:
Help user reach first success quickly.

Steps:
- welcome
- add first client
- add first invoice
- generate first reminder

Keep onboarding short.

### 3. Dashboard
Main operational overview page.

### 4. Clients List
Purpose:
Show all clients clearly and allow quick access.

Must support:
- list view
- search
- add client
- quick client summary

### 5. Client Detail
Purpose:
Show one client with related invoices and notes.

Must include:
- client info
- contact info
- invoice list
- reminder context
- quick add invoice action

### 6. Invoices List
Purpose:
Main invoice management page.

Must support:
- search
- filter
- sort
- create invoice
- import CSV
- row actions
- status visibility

### 7. Invoice Detail
Purpose:
One invoice view with complete context.

Must include:
- invoice info
- client info
- status
- due date
- amount
- reminder history
- generate reminder action

### 8. Reminder Generator
This can be a page, drawer, or dialog-based flow.

Must include:
- tone selector
- invoice context summary
- 2 to 3 generated drafts
- copy button
- mark handled / save history

### 9. Import CSV
Purpose:
Simple invoice import.

Must include:
- upload state
- validation state
- preview state
- import result state

### 10. Settings
Must include:
- profile
- default currency
- AI provider settings
- OpenAI-compatible base URL
- model
- API key input
- theme preferences if needed

---

## V1 Pages That Should NOT Exist
Do NOT create these for V1:
- CRM pipeline page
- Sales funnel page
- Revenue forecasting page
- Subscription billing page
- Team permissions center
- Payroll page
- Tax reporting page
- Full analytics suite
- Accounts reconciliation dashboard
- Contracts manager
- Payment gateway management
- Full email inbox client
- Project management pages
- Task management system unrelated to invoice follow-up
- Legal claims workflow
- Multi-workspace enterprise admin

---

## Recommended Page Connections / Navigation Flow

### Core Product Flow
Dashboard -> Who to Chase Today -> Invoice Detail -> Reminder Generator

### Operational Flow
Invoices List -> Invoice Detail -> Generate Reminder

### Relationship Flow
Clients List -> Client Detail -> Related Invoices -> Reminder Generator

### Setup Flow
Sign up -> Onboarding -> Add Client -> Add Invoice -> Dashboard

### Import Flow
Invoices List -> Import CSV -> Validation -> Import Complete -> Dashboard or Invoices

Navigation must feel natural and obvious.

The user should never feel that pages are disconnected.

---

## Skeleton Loading System

### Skeleton Philosophy
Skeletons must match the actual layout structure.

Do not use random gray bars.

Skeletons should communicate:
- where content will appear
- what type of content is loading
- approximate density of the final layout

### Required Skeleton States
Create proper skeletons for:
- dashboard summary cards
- chase-today list
- invoice table
- client table
- invoice detail header
- reminder generator drawer/dialog
- settings form
- import preview table

### Skeleton Rules
- match real component shapes
- keep animation subtle
- no flashy shimmer overload
- support dark and light mode
- preserve layout stability
- avoid content jumping

### Loading States to Design
Design all of these:
- initial page load
- table loading
- form submit loading
- AI draft generation loading
- CSV parsing loading
- empty loading fallback

---

## Empty States
Every major page needs a designed empty state.

### Required Empty States
- no clients yet
- no invoices yet
- no overdue invoices
- no reminders generated yet
- no import history
- no search results
- no chase items today

### Empty State Rules
Each empty state should include:
- clear message
- short explanation
- single next step
- optional supporting illustration or icon
- calm tone

Avoid dead-end empty states.

---

## Error States
Design proper error states for:
- failed AI generation
- failed CSV import
- failed invoice creation
- failed page load
- invalid provider config
- unauthorized or expired session

Rules:
- keep errors readable
- explain what happened
- suggest next action
- never dump raw technical text to user unless necessary

---

## Table UX Requirements
Invoice and client tables are critical.

### Invoice Table Must Show
- client
- invoice number or title
- amount
- due date
- status
- urgency
- reminder count
- last reminder date
- row actions

### Table Features
- sorting
- filtering
- search
- pagination or lazy loading later if needed
- row click to detail
- responsive handling

### Mobile Strategy
Do not cram full desktop tables into mobile.

Use:
- stacked row cards
- horizontal scroll only if necessary
- simplified row information hierarchy

---

## Invoice Detail Page Requirements
The invoice detail page should feel actionable, not bureaucratic.

### Must Include
- invoice title / number
- amount
- due date
- status
- urgency
- client identity
- payment link if available
- notes
- reminder history
- action buttons

### Primary Action
Generate Reminder

### Secondary Actions
- edit invoice
- mark as paid
- copy payment link
- archive if needed

---

## Reminder Generator UX
This is the emotional core of the product.

### Must Feel
- fast
- focused
- helpful
- low-friction
- intelligent
- confidence-building

### UI Elements
- invoice summary at top
- selected tone control
- generate button
- 2 to 3 draft cards
- clear copy button
- optional regenerate action
- draft selection state
- saved history marker

### Tone UI
Tone options should feel clear and intuitive:
- Friendly Nudge
- Professional Reminder
- Firm Deadline
- Final Notice

Represent tone visually without looking childish.

### Draft Cards
Each draft card should show:
- tone label
- subject line
- message preview
- copy action
- select action
- optional regenerate variation action

---

## Forms UX
Forms should be simple and confidence-building.

### Add Client Form
Fields:
- client name
- contact name
- email
- company name
- phone optional
- notes optional

### Add Invoice Form
Fields:
- client
- invoice number
- title
- issue date
- due date
- amount
- currency
- payment link optional
- notes optional
- status

Rules:
- use sensible defaults
- show validation clearly
- reduce unnecessary typing
- break into sections if needed

---

## Light Mode and Dark Mode Requirements
Both themes must feel intentional, not inverted afterthoughts.

### Dark Mode
- premium
- low-glare
- elegant
- focused on contrast hierarchy

### Light Mode
- clean
- professional
- soft but readable
- not sterile

### Theme Rules
- all surfaces must be tested in both modes
- all borders and muted text must remain readable
- status colors must still work in both themes
- skeletons must feel natural in both themes
- dialogs, tables, dropdowns, and inputs must remain visually consistent across both modes

---

## shadcn/ui Usage Strategy
Use shadcn/ui as a stable primitive layer, not as the final default UI identity.

### Good Use of shadcn/ui
Use it for:
- accessible base components
- data table foundation
- dialogs
- inputs
- badges
- dropdowns
- cards
- tabs
- sheets
- select
- form wiring

### Required Customization
Customize:
- theme tokens
- spacing rhythm
- card hierarchy
- status badges
- invoice list rows
- dashboard summary cards
- reminder draft cards
- empty states
- skeletons
- page layouts

Do not leave the app looking like a default shadcn demo.

---

## Invoicing-Specific UI Requirements
Because this is an invoicing product, the UI must clearly support:

- invoice tracking
- status visibility
- due-date awareness
- amount readability
- urgency prioritization
- reminder history
- quick follow-up generation
- client context

### High-Value UI Moments
Spend extra quality on:
- dashboard summary
- who to chase today
- invoice table
- invoice detail header
- reminder generator
- empty states
- skeletons

These are the highest-impact trust screens in V1.

---

## V1 Must-Have Components
- App sidebar
- Top header
- Summary stat cards
- Status badges
- Urgency pill/badge
- Search bar
- Filter bar
- Invoices data table
- Clients data table
- Client detail panel
- Invoice detail header
- Reminder draft cards
- Tone selector
- Empty states
- Skeleton components
- CSV import preview table
- Settings form blocks
- Theme toggle
- User menu

---

## V1 Nice-to-Have But Optional
Only build if time remains and quality is not compromised:
- keyboard shortcut palette
- mini trends on summary cards
- subtle motion between pages
- animated counter transitions
- onboarding progress tracker
- compact command bar
- quick add floating action on mobile

---

## V1 Should Explicitly Avoid
Avoid these in V1:
- noisy charts everywhere
- unnecessary graphs
- overly fancy 3D visual effects
- glowing AI panels
- cluttered metric walls
- excessive filters
- dense enterprise-style tables
- too many nested tabs
- complex right-side inspectors on every page
- too many accent colors
- giant forms
- fake productivity widgets
- chatbot-first UI replacing core invoice workflow

---

## Interaction and Motion Rules
Use motion sparingly and intentionally.

Good motion:
- subtle hover states
- clean dialog transitions
- controlled page transitions
- small loading feedback
- smooth theme transitions if safe
- gentle table row hover

Avoid:
- bouncy animations
- exaggerated spring effects
- distracting motion
- animated charts by default
- motion that slows the product down

---

## Accessibility Rules
The UI must remain accessible.

Requirements:
- clear contrast
- keyboard navigable
- focus states visible
- proper labels
- readable text sizes
- touch-friendly controls
- tables understandable
- dialogs accessible
- color not being the only status indicator

---

## Final UX Standard
Every page in V1 should pass this test:

The user opens the page and within a few seconds can answer:
- What am I looking at?
- What matters most here?
- What should I do next?
- What can I click?
- What is overdue?
- How do I take action quickly?

If a page does not answer those questions clearly, simplify it.

---

## Agent Instruction
Build the ChaseFree AI frontend as a clean, premium, minimal invoicing workflow product.

Use:
- Next.js
- Tailwind CSS
- shadcn/ui primitives
- custom theming
- dark mode and light mode
- strong skeleton and empty states
- clear page-to-page connectivity
- simple but polished financial workflow UI

Prioritize:
- readability
- information hierarchy
- urgency visibility
- low cognitive load
- quality over quantity
- stable components
- clean connected flows

Do not build a generic SaaS dashboard.
Do not build a CRM-like cluttered interface.
Do not build an analytics-heavy interface.
Do not overcomplicate V1.

The product should feel like a sharp, clean, focused command center for unpaid invoices and AI-powered follow-ups.