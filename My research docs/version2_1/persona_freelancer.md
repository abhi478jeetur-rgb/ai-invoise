# 🧑‍💻 Persona Review: Solo Freelancer

> **Name:** Priya Sharma  
> **Role:** Independent Web Developer & Designer  
> **Clients:** 5–12 active at any time  
> **Invoice volume:** 8–15 invoices/month  
> **Pain points:** Hates chasing payments manually, forgets who owes what, needs professional-looking PDFs fast  
> **Tech comfort:** Moderate — uses Gmail, Stripe, Notion, Figma  

---

## 📊 Overall Score: 7.8 / 10

| Area | Score | Notes |
|------|-------|-------|
| First Impression & Onboarding | 8/10 | Quick start banner is helpful |
| Invoice Creation (Smart Builder) | 7/10 | Works but has critical gaps |
| Dashboard Usefulness | 8/10 | "Who to Chase" is genuinely useful |
| AI Reminders | 9/10 | Killer feature — tone selection is smart |
| PDF Quality | 6/10 | Functional but not premium |
| Client Management | 6/10 | Too basic for real use |
| Settings & Configuration | 7/10 | Solid but overwhelming |
| Mobile Responsiveness | 5/10 | Sidebar doesn't work on mobile |
| Error Handling & Resilience | 8/10 | Toast notifications are clean |

---

## ✅ What Priya Loved

### 1. "Who to Chase Today" — Dashboard
> "This is exactly what I need every morning. I open the app, I see who I need to bug today, and I click Generate Reminder. Done in 2 minutes."

- The urgency color-coding (red for overdue, yellow for due soon) is immediately intuitive
- Last reminded timestamp prevents over-chasing
- Direct "Generate Reminder" CTA next to each invoice is a workflow shortcut

### 2. AI Reminder Generation — Tone Presets
> "The tone system is brilliant. I start with Friendly Nudge, and if they don't pay, I escalate to Firm, then Final Notice. It feels like I have an assistant."

- 4 tone presets cover 100% of Priya's real follow-up scenarios
- Auto-recommended tone based on overdue days is smart
- 3 variant outputs let her pick the one that "sounds like her"
- SMS/WhatsApp short version is practical for Indian clients who prefer WhatsApp

### 3. Toast Notifications
> "The old alerts used to block the screen. Now the little toasts slide in from the bottom — much cleaner."

- `toast.promise` for saving invoices shows progress
- Network error toasts are genuinely helpful when working from cafés
- No more layout-shifting success banners

### 4. Unbilled Scratchpad
> "I can quickly dump 'Finished Acme homepage redesign' at 2 AM and invoice it later. This is like a sticky note inside my billing tool."

- Quick entry with just a text field
- Convert-to-invoice button is a great workflow bridge

---

## ❌ Problems Priya Found

### 🔴 Critical: No Tax / GST Support
> "I'm in India. Every invoice MUST have GST (18%). There's no tax field anywhere in the Smart Builder. I can't use this for real invoices."

- **Where:** Smart Builder → Line Items section
- **Impact:** DEALBREAKER for freelancers in India, EU (VAT), Australia (GST), and most of Asia
- **Expected:** A tax row after subtotal, configurable per invoice OR from settings
- **Current state:** Settings has `default_tax_label` and `default_tax_rate` fields but Smart Builder completely ignores them

### 🔴 Critical: No Discount Field
> "I frequently give 10% early-payment discounts. There's nowhere to add this."

- **Where:** Smart Builder → Line Items section
- **Impact:** Forces manual workaround (negative line item) which looks unprofessional on PDF

### 🟡 Major: Currency is a Free-Text Input
> "I accidentally typed 'usd' lowercase and the PDF showed a wrong symbol. Why isn't this a dropdown?"

- **Where:** Smart Builder → Invoice Details → Currency field (line ~234 of smart-builder-client.tsx)
- **Expected:** A dropdown with supported currencies (like Settings already has)
- **Current:** Raw `<Input>` that accepts any string — `Intl.NumberFormat` will crash on invalid currency codes

### 🟡 Major: No Draft Status for Invoices
> "I started building an invoice but wasn't ready to send it. There's no 'Save as Draft' option — it just saves and goes back to the list as 'sent' status."

- **Where:** Smart Builder → Save Invoice button
- **Impact:** Every saved invoice is treated as "sent" even if incomplete
- **Expected:** "Save as Draft" vs "Mark as Sent" — two distinct actions

### 🟡 Major: PDF Doesn't Show Line Item Details
> "I add descriptions to line items but they don't always appear clean in the PDF. The layout needs better spacing."

- Line item descriptions are truncated or cramped in the PDF template
- No per-line-item tax or per-line-item discount visible

### 🟠 Minor: Client Detail Page is Bare
> "When I click on a client, I expected to see their invoice history — total billed, total paid, outstanding. Instead it's just their contact info."

- **Where:** `/clients/[clientId]` page
- **Expected:** Invoice history, payment summary, notes timeline
- **Current:** Just name, email, company — essentially the same as the list view

### 🟠 Minor: No Invoice Numbering Auto-Increment
> "It pre-fills an invoice number but I can't configure the format. I want 'PS-2026-001' not 'INV-001'."

- **Where:** Smart Builder → Invoice Number field
- **Expected:** Configurable prefix in Settings, auto-incrementing sequence
- **Current:** Manual text field

### 🟠 Minor: Sidebar Doesn't Indicate Active Page
> "I sometimes don't know which page I'm on because the sidebar icons all look the same — no highlight on the active one."

- **Where:** Sidebar component
- **Impact:** Mild confusion, especially when navigating fast

### 🟠 Minor: No Payment Confirmation / Receipt
> "When a client pays, I mark it as Paid, but there's no way to generate a payment receipt PDF."

---

## 🔧 Priya's Feature Wishlist (Priority Order)

1. **Tax/GST support** — Per-invoice or global default. Non-negotiable.
2. **Discount field** — Percentage or flat amount
3. **Currency dropdown** — Replace free-text input
4. **Draft vs Sent status** — Don't auto-send on save
5. **Client invoice history** — Show billing summary on client detail page
6. **Recurring invoices** — Monthly retainers for ongoing clients
7. **Payment receipt PDF** — Confirmation document after payment
8. **Configurable invoice number format** — Prefix + sequence
9. **Mobile sidebar** — Hamburger menu for phone usage
10. **Email integration** — Send invoice directly from app instead of copy-paste

---

## 💡 Priya's Verdict
> "ChaseFree AI solves my #1 pain — chasing payments. The AI reminders alone are worth signing up for. But I literally cannot use this for my Indian clients without GST support. Fix taxes, add a currency dropdown, and give me draft mode — then I'm all in."
