# UI-SPEC.md

## Purpose
This document defines the UI and visual behavior rules for ChaseFree AI.

The goal is to make the product look polished, stable, modern, and trustworthy without becoming flashy, oversized, noisy, or visually inconsistent.

This is a strict UI spec for implementation.

The agent must use this document to build and refine the interface in a controlled way.

---

## Core UI Philosophy
The ChaseFree AI interface must feel:
- calm
- clean
- compact
- modern
- trustworthy
- structured
- readable
- product-focused

It must not feel:
- oversized
- decorative
- noisy
- colorful for no reason
- template-heavy
- visually inconsistent
- over-designed
- AI-generated in a generic way

The interface should feel like a real product used by freelancers for serious money-related work.

---

## Non-Negotiable Visual Rules

### 1. Do not introduce a new visual language
The agent must not introduce:
- a new font family
- a new theme system
- a new color palette
- gradient-heavy styling
- bright accent experiments
- unusual shadows
- oversized rounded corners
- random custom spacing systems

Use the existing product styling foundation and existing shadcn-compatible theme behavior only.

If the current app already has a working font, color scale, and theme system, preserve it.

Do not reinvent the design system.

---

### 2. Nothing should feel too large
No UI element should feel oversized.

Avoid:
- giant headings
- huge cards
- extra-tall table rows
- oversized buttons
- oversized badges
- large empty padded areas
- large icons used as decoration
- bloated modals
- giant metrics that dominate the screen

The product is a working tool, not a marketing landing page.

The user should feel that the interface is efficient and well-proportioned.

---

### 3. No strange colors
Do not add any strange, loud, or isolated colors for new elements.

Avoid:
- random blue, purple, pink, orange, green, or red blocks that do not match existing tokens
- custom gradient badges
- one-off card colors
- bright icon backgrounds
- unrelated highlight colors
- mismatched success/warning/error shades
- visually attention-seeking color experiments

Any new element must inherit from the existing neutral + semantic color system.

If color is needed, use only:
- existing foreground/background tokens
- existing border tokens
- existing muted/secondary tokens
- existing semantic status colors only where appropriate

No new decorative color accents are allowed.

---

### 4. No new font
Do not import or use a new font.

Do not mix additional font families.

Do not add “premium-looking” display fonts.

Do not create a special heading font.

Use the current product font stack only.

Typography improvements must come from:
- better hierarchy
- better sizing
- better spacing
- better weight usage
- better alignment

Not from introducing new font assets.

---

## Visual Tone
The product should visually communicate:
- financial seriousness
- clarity
- control
- low stress
- confidence
- practical usefulness

This is not a startup landing page and not a playful consumer app.

The UI should help a user quickly understand:
- what needs attention
- what is overdue
- what to do next
- what can be ignored for now

---

## Size and Density Rules

### General Density Rule
Use moderate density.

The app should not feel:
- too dense and cramped
- too loose and wasteful

Preferred outcome:
- enough breathing room to scan
- compact enough to feel efficient
- clear separation between sections
- minimal wasted vertical space

---

### Typography Size Rules
Use restrained typography.

Preferred hierarchy:
- Page title: medium, strong, but not huge
- Section title: slightly smaller than page title
- Card title: normal medium emphasis
- Body text: standard readable size
- Meta text: smaller but still readable
- Badges and labels: compact

Avoid:
- giant dashboard headings
- hero-style text
- very large metric numerals
- huge labels for simple sections

The dashboard should feel like a product dashboard, not a presentation slide.

---

### Button Size Rules
Buttons must be practical and compact.

Preferred characteristics:
- medium height
- clear label
- balanced horizontal padding
- no giant icon buttons
- no chunky CTA style unless truly primary

Avoid:
- oversized primary buttons
- very tall action bars
- giant pills
- extra-wide buttons with too much whitespace

Use visual weight through contrast and placement, not size inflation.

---

### Card Rules
Cards should be controlled and quiet.

Preferred characteristics:
- normal radius
- standard padding
- subtle border or subtle separation
- no loud shadow
- no decorative color bar
- no oversized title areas

Avoid:
- giant dashboard cards
- cards with too much vertical padding
- cards with random tinted backgrounds
- marketing-style feature blocks
- uneven card heights when not intentional

Cards should exist to organize information, not to impress visually.

---

### Table Rules
Tables are critical in this product.

Use a clean and practical table design based on shadcn data table patterns.

Requirements:
- compact but readable row height
- clear header row
- restrained cell padding
- good scanability
- no oversized text
- clear status badge placement
- due date and amount should be easy to compare
- action controls should not dominate the row

Avoid:
- airy oversized enterprise-table styling
- tiny unreadable dense rows
- too many borders
- colorful cells
- giant row actions
- table rows that look like cards unless specifically needed on mobile

The invoice table should feel operational and efficient.[web:103]

---

## Layout Rules

### General Page Layout
Each page must have:
- one clear page title
- one clear primary action
- a logical section order
- visible structure
- predictable spacing rhythm

Avoid:
- too many competing sections
- too many highlighted blocks at the top
- floating random widgets
- dashboard clutter
- uneven visual weight

Each page should answer:
- what page is this?
- what is the main action?
- what matters first?
- what matters second?

---

### Top Section Rule
The top area of any page should contain only high-value information.

For the dashboard, top priority content is:
- compact summary metrics
- “Who to Chase Today”
- one main CTA

Do not fill the top with:
- decorative content
- low-value charts
- filler stats
- secondary settings
- noise

The top should feel immediately useful.

---

### Section Rhythm Rule
Section spacing should be consistent and intentional.

Avoid:
- one section with huge spacing and another with cramped spacing
- giant empty gaps
- stacked cards with no structure
- random padding differences

The whole app should feel like it belongs to one coherent system.

---

## Color Usage Rules

### Base Rule
Stick to the existing theme and token system.

Use color sparingly and intentionally.

The UI should mostly rely on:
- background contrast
- border contrast
- text hierarchy
- spacing
- semantic state badges

Not on decorative color usage.

---

### Status Color Rule
Status colors are allowed only when they communicate meaning.

Examples:
- overdue
- paid
- due soon
- error
- success
- warning

Even then:
- keep them restrained
- do not over-saturate
- do not color the whole card unless already part of the system
- prefer badges, labels, dots, or subtle accents over full background fills

A status indicator should communicate state, not hijack the entire interface.

---

### New Component Color Rule
When creating any new component, the default assumption must be:
- neutral background
- standard border
- standard foreground text
- muted secondary text

Do not try to “make it stand out” with a new color.

A component should earn emphasis through:
- position
- hierarchy
- grouping
- clear labeling

Not by inventing a new visual style.

---

## Typography Rules

### Hierarchy Rule
Use typography hierarchy carefully.

Use differences in:
- font weight
- size
- spacing
- muted vs normal text

Do not create hierarchy through:
- random uppercase overuse
- giant headings
- extra letter spacing everywhere
- decorative font styles

---

### Readability Rule
Every important piece of text should be easy to scan.

Invoice interfaces especially require clarity for:
- invoice number
- client name
- amount
- due date
- status
- reminder state

These must never feel visually buried.

---

### Labeling Rule
Use short, direct labels.

Avoid:
- fluffy section titles
- marketing phrases
- clever but unclear labels
- vague dashboard wording

Preferred examples:
- Invoices
- Clients
- Overdue
- Due Soon
- Reminder History
- Generate Reminder
- Who to Chase Today

The UI language should feel operational and useful.

---

## Component Behavior Rules

### Summary Cards
Summary cards must be:
- compact
- easy to compare
- equal in visual weight
- not oversized
- not too tall

Each summary card should contain:
- small label
- clear value
- optional small secondary context

Avoid:
- giant metric numbers
- large icon circles
- decorative illustrations
- long descriptions inside metric cards

---

### Status Badges
Status badges must be:
- small
- readable
- consistent
- color-controlled
- not too rounded
- not too loud

Avoid:
- oversized capsules
- glowing badges
- random color shades
- one-off badge styles

All invoice statuses should feel like one family of components.

---

### Modals / Dialogs
Dialogs should be:
- compact
- focused
- not too wide
- not too tall
- clearly structured

Avoid:
- giant empty dialog shells
- too many actions
- oversized headers
- decorative layouts inside modal content

Reminder generation dialogs should feel lightweight and task-focused.

---

### Forms
Forms must feel practical.

Requirements:
- clean labels
- standard field spacing
- no giant field heights
- no giant textarea unless needed
- clear validation states
- simple helper text

Avoid:
- bloated forms
- overly spaced vertical stacks
- inconsistent input sizing
- decorative form sections

---

## Dashboard-Specific Spec

### Dashboard Goal
The dashboard must help the user quickly understand:
- how much is unpaid
- what is overdue
- who needs follow-up today
- what action to take next

It must not feel like a generic analytics page.

---

### Dashboard Structure
The dashboard should follow this order:

#### Row 1
- Page title on the left
- Primary action on the right

Primary action examples:
- Add Invoice
- Generate Reminder
- Add Client

Only one action should have highest visual priority.

---

#### Row 2
Compact summary cards:
- Unpaid Amount
- Overdue Amount
- Due This Week
- Clients To Chase

Rules:
- all cards same family
- compact height
- no giant numerals
- no decorative icons unless already used consistently
- equal visual rhythm

---

#### Row 3
Main high-value section:
- Who to Chase Today

This section should be one of the most visually important sections on the page, but not through loud styling.

It should stand out through:
- placement
- clear heading
- clean container
- focused list structure

Not through:
- a bright color block
- giant typography
- oversized warning visuals

---

#### Row 4
Secondary operational content:
- Recent Invoices
- Recent Reminder Activity

These should support the main workflow and remain visually secondary to “Who to Chase Today.”

---

### “Who to Chase Today” Section Rules
This section is central to the product.

Each row/item should show:
- client name
- invoice title or number
- amount
- due date
- urgency label
- one clear quick action

The list should feel:
- scannable
- compact
- action-oriented
- calm but urgent

Avoid:
- too much text per item
- giant colored backgrounds
- large alert icons
- exaggerated warning styling
- multi-line clutter unless needed

Urgency should be visible without visual chaos.

---

## Invoices Page Spec

### Purpose
The invoices page is an operational workspace, not a gallery.

It should optimize for:
- scanability
- filtering
- sorting
- quick action
- status visibility

---

### Invoices Page Layout
Top area:
- page title
- search
- filter controls
- add invoice action

Main body:
- invoice data table

Optional secondary content:
- import action
- lightweight bulk action tools if actually needed

Avoid:
- unnecessary charts
- decorative widgets
- noisy side panels
- too many top-row controls

---

### Invoice Table Columns
Recommended columns:
- Invoice
- Client
- Amount
- Due Date
- Status
- Reminder State
- Actions

Each column should have a clear reason to exist.

Do not overload the table with too many columns.

---

### Invoice Table Style
The invoice table should:
- use clean shadcn-style structure
- remain compact
- preserve alignment
- keep actions small and secondary
- use badges carefully
- highlight due date and status clearly

Do not:
- make each row look like a marketing card
- use oversized text
- use multi-color cells
- turn row actions into giant buttons

---

## Invoice Detail Page Spec

### Purpose
The invoice detail page should help the user understand one invoice clearly and act on it.

Main areas:
- invoice summary
- status and urgency
- client details
- reminder history
- generate reminder action

---

### Visual Priority
Top priority:
- invoice identification
- amount
- due date
- current status
- reminder generation action

Secondary:
- notes
- metadata
- timeline/history

Avoid making metadata visually louder than the main status and action.

---

## Reminder Generator Spec

### Goal
The reminder generator should feel fast, useful, and low-pressure.

It should not feel like a complicated AI workspace.

---

### Layout
Preferred structure:
- invoice context summary at top
- tone selector
- generated draft options
- copy action
- optional mark-as-handled action

Avoid:
- giant prompt editor feel
- complex AI lab interfaces
- large decorative AI sections
- too many controls before output

This is a utility flow, not an experimentation playground.

---

### Draft Cards
Draft cards should:
- be readable
- have standard spacing
- have clear title/variant labeling
- have practical copy action
- not use strange colored backgrounds

Each draft should feel like a usable business message.

---

## Clients Page Spec

### Purpose
The clients page should be simple and functional.

Main focus:
- find client
- add client
- open client
- see associated invoice state

Avoid turning this into a CRM-heavy page.

---

### Layout
Use:
- page title
- add client action
- search/filter if needed
- clear list or table

Do not:
- add sales pipeline UI
- add decorative client cards unnecessarily
- add colorful engagement widgets

---

## Mobile Rules
On mobile, the product must remain usable and calm.

Rules:
- no oversized stacked cards
- no giant headers
- no giant CTA blocks
- no cramped tables without adaptation
- key actions must remain reachable
- content must stack cleanly
- row density should remain readable

For table-heavy screens, adapt carefully:
- preserve key data first
- hide low-priority metadata
- avoid noisy card conversions if they become too tall

Mobile should feel efficient, not bloated.

---

## Empty State Rules
Empty states should be:
- clean
- small to medium in size
- helpful
- action-oriented
- visually quiet

Avoid:
- giant illustrations
- playful mascot behavior
- oversized empty boxes
- too much explanatory text

Each empty state should answer:
- why this is empty
- what the user should do next

---

## Loading and Error State Rules
Loading and error states must match the main UI system.

Avoid:
- random loaders with new colors
- giant skeleton blocks
- decorative spinners
- visually disruptive warning boxes

Keep these states:
- compact
- consistent
- restrained
- clear

---

## Consistency Rules
Every new screen and component must match the existing product system in:
- font
- spacing
- radius
- color usage
- interaction weight
- visual density

If a new element visually looks like it belongs to a different app, it must be revised.

---

## Rejection Rules
The following changes should be rejected automatically:
- adding a new font
- adding a new theme
- adding a new palette
- making headings much larger
- making cards much taller
- introducing random accent colors
- using gradients for emphasis
- using decorative icon circles everywhere
- making buttons oversized
- turning dashboard sections into marketing blocks
- adding visual styles that are not already supported by the current design system

---

## Final UI Standard
The ChaseFree AI interface should look like a compact, polished, trustworthy financial workflow product.

It should not try to impress through size, color, or decoration.

It should impress through:
- clarity
- balance
- consistency
- restraint
- usability
- excellent information hierarchy

If a UI change makes the app louder, larger, more colorful, or more decorative without improving workflow clarity, that change should not be accepted.