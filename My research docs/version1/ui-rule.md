# UIRules.md

## Purpose
This document defines the complete UI rules for ChaseFree AI V1.

Its purpose is to ensure that the product:
- does not look like a generic template
- does not feel like a bloated admin panel
- remains focused on invoice chasing workflows
- uses shadcn/ui correctly
- maintains consistent product identity
- stays clear, calm, and professional

This document should guide all UI decisions across:
- layout
- typography
- spacing
- colors
- component usage
- empty states
- loading states
- tables
- forms
- AI reminder flows
- responsiveness
- interaction quality

---

## Core UI Direction

### Product Personality
ChaseFree AI should feel:
- calm
- focused
- modern
- trustworthy
- emotionally supportive
- lightweight
- professional
- not corporate-boring
- not playful
- not aggressive
- not finance-enterprise heavy

### Product Mood
This is not a flashy AI toy.

This is a focused workflow tool for freelancers who feel stress around unpaid invoices.

The interface should reduce anxiety, not increase it.

### Design Identity
Think:
- clean SaaS product
- modern dashboard
- high trust
- strong readability
- restrained color usage
- action-first UI

Do not design it like:
- crypto dashboard
- analytics-only BI tool
- startup landing page
- neon AI app
- ERP software
- generic shadcn demo

---

## Main UI Principles

### 1. Clarity First
Every screen should tell the user:
- what they are looking at
- what matters most
- what action comes next

### 2. Action Over Decoration
UI should help the user act:
- review overdue invoices
- generate reminder
- mark invoice paid
- track reminder history

Decorative visuals should never compete with these actions.

### 3. Calm Financial UX
The app should help users deal with money-sensitive situations in a non-threatening way.

Use visual urgency carefully.

Do not make the product feel scary or hostile.

### 4. Small, Dense, Readable
This is a web app, not a marketing page.

UI should be compact but not cramped.

### 5. One Primary Action Per Screen
Each major screen should have one dominant action.

Examples:
- Dashboard → Review who to chase today
- Clients → Add client
- Invoices → Add invoice
- Invoice detail → Generate reminder

---

## Layout Rules

### App Shell
Use a standard app shell with:
- sidebar for primary navigation
- top header for page context and secondary actions
- main content area for the current page

### Main Navigation
Main sections:
- Dashboard
- Clients
- Invoices
- Settings

Do not create many first-level nav items.

### Sidebar Behavior
Desktop:
- expanded sidebar with icons + labels

Tablet:
- collapsible or icon-only sidebar

Mobile:
- hidden drawer/sidebar opened by menu button

### Header Behavior
The top header should include:
- page title
- optional breadcrumbs if needed
- optional search where useful
- user menu
- theme toggle if supported

### Page Containers
Use a consistent page container width and padding.

Recommended:
- compact horizontal padding on mobile
- moderate padding on desktop
- strong spacing consistency across screens

### Section Order Rule
Within dashboard-like screens, follow this order:
1. Most important action area
2. Summary state
3. Supporting information
4. History / detail / secondary actions

---

## Typography Rules

### Type Scale
Use compact web app typography only.

Allowed sizes:
- Page title
- Section heading
- Body text
- Button / nav text
- Label / badge / metadata text

Do not use giant marketing headings inside the app UI.

### Hierarchy
Suggested hierarchy:
- Page title = strongest
- Section heading = second
- Body text = default
- Labels / metadata = smallest

### Readability Rules
- keep labels short
- avoid long paragraphs in the app
- dashboard copy should be scannable
- text should be left-aligned by default
- use sentence case, not all caps everywhere

### Number Styling
For financial values, dates, and invoice numbers:
- use consistent formatting
- use tabular number styling where possible
- align numeric columns properly in tables

### Tone of UI Copy
Use copy that is:
- concise
- direct
- calm
- helpful

Good examples:
- Add invoice
- Generate reminder
- Mark paid
- Due in 2 days
- Overdue by 8 days
- No reminders yet

Bad examples:
- Unlock the power of your accounts receivable
- Supercharge your payment collection workflow
- Empower your invoicing journey

---

## Color Rules

### General Color Strategy
Use:
- neutral surfaces
- one primary accent
- limited semantic colors

Do not use too many colors.

The app should feel restrained.

### Recommended Color Roles
Use colors for:
- primary actions
- status indication
- subtle emphasis
- not decoration

### Status Colors
Status colors should be meaningful and consistent:

- Draft → neutral muted
- Sent → calm blue or neutral-info
- Due Soon → amber/yellow
- Overdue → red or rose
- Paid → green
- Archived → muted neutral

### Important Rule
Do not color everything.

Most of the interface should stay neutral so status colors remain useful.

### AI UI Color Rule
Do not use purple-glow AI styling.

Avoid:
- blue-purple gradients
- glowing blobs
- neon accents
- “AI magic” visuals

AI should feel integrated into the product, not like a separate gimmick.

---

## Spacing Rules

### Spacing Philosophy
Spacing should make the app feel:
- breathable
- organized
- deliberate

### Rules
- use one consistent spacing system
- avoid random per-component spacing
- forms should have predictable spacing
- card padding should be consistent
- page section gaps should be stable

### Density Rule
ChaseFree is a working product, so density should be balanced:
- not ultra-spacious like a landing page
- not overly compressed like enterprise admin software

---

## Surface and Card Rules

### Cards
Cards should be used for:
- summary metrics
- chase today items
- invoice highlights
- reminder draft options
- empty states

### Card Style
Cards should feel:
- clean
- slightly elevated or subtly bordered
- easy to scan
- not overly rounded
- not bubbly

### Avoid
- loud colored borders
- heavy shadows everywhere
- too many nested cards
- glassmorphism
- gradient card backgrounds

### Priority Cards
If one card is most important, emphasize it through:
- placement
- spacing
- scale
- stronger heading
- stronger CTA

Not through excessive decoration.

---

## Button Rules

### Button Hierarchy
Use three main button priorities:
- Primary
- Secondary
- Ghost / subtle

### Primary Button
Use only for the most important action in a section.

Examples:
- Add invoice
- Generate reminder
- Save AI settings

### Secondary Button
Use for supporting actions:
- Edit
- View details
- Try another tone

### Ghost / Subtle
Use for low emphasis:
- Cancel
- Dismiss
- Minor row actions

### Button Copy
Button labels should be short and action-based.

Good:
- Add client
- Save
- Mark paid
- Copy draft

Bad:
- Click here to proceed
- Submit your request now
- Generate an amazing reminder

---

## Form Rules

### General Form Design
Forms should feel simple and safe.

The user should never feel overwhelmed by fields.

### Required Behavior
- clear labels
- optional field markers where needed
- visible validation errors
- sensible defaults
- grouped related fields

### Field Grouping
Examples:
- client info group
- invoice basics group
- payment details group
- AI settings group

### Form Length Rule
If a form becomes too long:
- break into logical sections
- use accordions or section dividers if needed
- avoid giant walls of inputs

### Validation UX
- show inline validation
- errors should appear near the field
- do not rely only on top-level toast errors
- preserve entered data when validation fails

### Input Types
Use correct controls:
- text input for short text
- textarea for notes
- select for controlled states
- date input / date picker for dates
- numeric input for amount
- password-style input for API key if needed

---

## Table Rules

### Role of Tables
Tables are important for invoices and possibly clients.

They should help the user:
- scan
- sort
- filter
- act quickly

### Invoice Table Must Support
- sorting
- filtering
- row click or view action
- row actions menu
- clear status badge
- due date visibility
- amount alignment
- reminder count visibility

### Table Column Guidance
For invoices, useful columns:
- client
- invoice number
- title
- amount
- due date
- status
- reminder count
- last reminder
- actions

### Table UX Rules
- sticky header if useful
- hover state on rows
- clear selected/focused state
- action menu at row end
- keep row height compact but readable

### Mobile Rule
Do not force a wide dense table on small screens.

On mobile:
- collapse to cards
- or show simplified rows
- or provide horizontal scroll only if still usable

### Table Copy Rules
Use short headers:
- Client
- Invoice
- Due date
- Amount
- Status
- Reminders

---

## Dashboard Rules

### Dashboard Goal
The dashboard is not a reporting page first.

It is an action center.

### Dashboard Sections
Must include:
1. summary metrics
2. who to chase today
3. recent invoices
4. reminder activity

### Section Priority
“Who to Chase Today” must be visually strongest.

### Summary Metrics
Use summary cards for:
- unpaid total
- overdue total
- due this week
- clients to chase today

### Chase Today UI
This section should:
- be easy to scan
- prioritize urgency
- show invoice context quickly
- expose generate reminder action immediately

### Reminder Activity
Keep this lightweight.

It should support trust and continuity, not dominate the page.

---

## Invoice Detail Page Rules

### Role
This page is the context hub.

The user should understand:
- what the invoice is
- who the client is
- how urgent it is
- what reminders already happened
- what to do next

### Page Sections
Recommended order:
1. invoice header
2. status + due state
3. amount + payment details
4. client section
5. reminder history
6. AI reminder generator

### Main CTA
Generate Reminder must be the primary CTA.

### Secondary Actions
- Edit invoice
- Mark paid
- Archive
- Copy payment link

### Visual Rule
Urgency should be visible, but not dramatic.

---

## AI Reminder UI Rules

### General Goal
The AI flow should feel useful and controlled.

It should never feel random or magical.

### Required Elements
- tone selector
- optional instruction field
- loading state
- 2 to 3 draft options
- copy action
- regenerate action
- edit before use
- visible history context nearby

### Draft Option Cards
Each draft option should show:
- option label
- subject
- body preview or full body
- short follow-up
- copy button
- use / edit action if needed

### Tone Selector
Tone options:
- Friendly
- Professional
- Firm
- Final Notice

Tone selection UI should feel simple, not complicated.

### Loading State
Use skeletons or meaningful loading placeholders.

Do not show a raw spinner alone if avoidable.

### Important Rule
Always make it clear that AI is using invoice and reminder context.

This builds trust.

---

## Empty State Rules

### All Empty States Must Include
- clear explanation
- next step
- CTA

### Dashboard Empty State
Message should explain the product briefly and guide toward adding first invoice.

### Clients Empty State
Prompt user to add first client.

### Invoices Empty State
Prompt:
- create invoice
- import CSV

### Reminder Empty State
Explain that generated reminders will appear here.

### Tone
Empty state copy should feel encouraging, not promotional.

---

## Loading State Rules

### Use Skeletons
Prefer skeletons over generic spinners.

### Loading Patterns
- dashboard cards skeleton
- table row skeleton
- invoice detail skeleton
- draft cards skeleton

### Rule
Loading UI should resemble final UI structure.

---

## Error State Rules

### Error Design
Errors must be:
- clear
- local where possible
- recoverable

### Common Errors
- missing AI settings
- failed AI response
- validation errors
- not found
- network issues

### Error UX Rules
- show inline error near failing section
- preserve user context
- provide retry
- do not show technical dumps to normal users

---

## Status and Badge Rules

### Badge Usage
Badges should be used for:
- invoice status
- urgency labels
- tone labels if useful

### Badge Style
Badges should be:
- compact
- readable
- consistent
- not overly bright

### Urgency Labels
Examples:
- Due soon
- Due today
- 3 days overdue
- 8 days overdue
- Paid

---

## Navigation Rules

### Sidebar Labels
Use clear text labels, not only icons.

### Active State
Current page should be obvious.

### Grouping
Do not create too many nav groups.

### User Menu
Include:
- profile
- settings
- sign out

---

## Search and Filter Rules

### Search
Search should be available where record density makes it useful:
- clients
- invoices

### Filters
Filters should be visible and understandable.

For invoices, useful filters:
- status
- due state
- client
- date

### Rule
Do not hide essential filters deep inside menus.

---

## Modal / Dialog Rules

### Use Dialogs For
- quick create
- confirmations
- short edits
- mark paid flow

### Use Full Pages For
- invoice detail
- large forms
- client detail
- settings

### Dialog Rule
Do not put extremely long forms inside small dialogs.

---

## Toast Rules

### Use Toasts For
- success confirmations
- background updates
- low-risk feedback

Examples:
- Client created
- Invoice updated
- Draft copied

### Do Not Use Toasts For
- important validation errors
- AI failure details that need action
- major blocking problems

Those should be inline.

---

## Icon Rules

### Use Icons Sparingly
Icons should support labels, not replace them.

### Good Icon Uses
- sidebar nav support
- row action menu trigger
- status support
- copy action support

### Avoid
- icon-only nav
- decorative icon overload
- colored icon circles everywhere

---

## shadcn/ui Usage Rules

### Use shadcn/ui As Foundation
Use shadcn/ui for:
- buttons
- inputs
- dialogs
- tables
- badges
- tabs
- dropdowns
- forms
- sheet/drawer
- tooltips

### Important Rule
Do not ship raw default shadcn styling everywhere.

You must customize:
- spacing
- hierarchy
- layout composition
- card usage
- state styling
- status styling
- table behavior
- page sections

### Product-Specific Components Required
Build reusable custom components such as:
- InvoiceStatusBadge
- InvoiceUrgencyPill
- SummaryMetricCard
- ChaseTodayCard
- ReminderToneSelector
- ReminderDraftCard
- ReminderHistoryList
- EmptyStateBlock
- AISettingsForm
- InvoiceTableToolbar

---

## Responsiveness Rules

### Desktop
Should feel efficient and dashboard-like.

### Tablet
Should preserve hierarchy with reduced width.

### Mobile
Must still support:
- dashboard scan
- invoice lookup
- reminder generation
- copy draft
- mark paid

### Mobile Adjustments
- stack dashboard sections
- reduce table density
- collapse filters if needed
- keep main CTA visible
- make draft cards easy to read and copy

---

## Accessibility Rules

### Must-Haves
- keyboard accessible
- visible focus states
- semantic headings
- proper labels
- color contrast safe
- touch target friendly
- no color-only meaning

### Buttons and Inputs
- every icon button needs accessible label
- every input needs visible label
- status meaning should not depend only on color

---

## Motion Rules

### Motion Style
Use subtle motion only.

### Good Motion
- hover feedback
- drawer transitions
- table row hover
- draft card reveal
- loading skeleton shimmer
- soft status transitions

### Avoid
- bouncing UI
- flashy entrance animations
- heavy parallax
- dramatic AI effects

The app should feel stable.

---

## Copy Rules

### Writing Style
Use:
- short labels
- calm wording
- direct instructions

### Good Examples
- Add invoice
- No overdue invoices
- Generate reminder
- Last reminder 3 days ago
- Payment link available

### Avoid
- hype language
- startup buzzwords
- overly friendly fluff
- robotic AI phrases

---

## Anti-Patterns to Avoid

Do not do any of the following:
- generic 3-column SaaS feature section style inside app UI
- oversized hero headings in app screens
- purple AI glow styling
- gradients on main buttons
- too many cards inside cards
- icon in colored circle repeated everywhere
- centered dashboard layouts
- too many equal-priority CTAs
- hidden important actions
- unclear urgency hierarchy
- overuse of red across the entire product
- giant empty states with too much copy
- raw default shadcn look with no product identity

---

## Screen-Level Primary UI Rules

### Dashboard
Primary emphasis:
- Who to Chase Today

### Clients
Primary emphasis:
- Add client
- search and browse clients

### Invoices
Primary emphasis:
- Add invoice
- filter and scan invoice state

### Invoice Detail
Primary emphasis:
- Generate reminder

### Settings
Primary emphasis:
- save configuration safely

---

## Visual Consistency Rules
Across all screens, maintain consistency in:
- page padding
- card padding
- button sizes
- status badge style
- table row behavior
- modal width rules
- heading hierarchy
- empty state style
- error message style

No screen should feel like it came from another template.

---

## Final Agent Instruction
Design and build ChaseFree AI V1 as a focused, calm, modern invoicing workflow product.

The UI must:
- help freelancers chase unpaid invoices with less stress
- make “Who to Chase Today” the central workflow
- make invoice detail the decision hub
- make AI reminder generation feel controlled and trustworthy
- use shadcn/ui as a base, not as the final product design
- avoid generic admin-template aesthetics
- stay compact, readable, consistent, and production-ready