# 🧾 Persona Review: Finance / Operations Manager

> **Name:** Sarah Mitchell  
> **Role:** Operations Manager at a 20-person digital consultancy  
> **Responsibility:** Manages all billing, accounts receivable, and financial reporting  
> **Invoice volume:** 80–120 invoices/month across 50+ clients  
> **Pain points:** Needs audit trails, bulk operations, reporting, compliance, and data accuracy  
> **Tech comfort:** High — uses Excel, QuickBooks, Xero, HubSpot, Salesforce  

---

## 📊 Overall Score: 4.5 / 10

| Area | Score | Notes |
|------|-------|-------|
| Data Accuracy & Integrity | 5/10 | Currency issues, no validation |
| Reporting & Analytics | 1/10 | No reporting exists |
| Audit Trail | 4/10 | Reminder events exist, but no invoice audit |
| Bulk Operations | 1/10 | Zero bulk capabilities |
| Search & Filtering | 5/10 | Basic but functional |
| Compliance & Tax | 2/10 | No tax, no legal number sequencing |
| Accounts Receivable Workflow | 6/10 | Status flow is good, aging missing |
| Data Export | 0/10 | No CSV, no PDF batch, no API |
| User Permissions | 0/10 | Single-user only |
| Integration Readiness | 2/10 | No webhooks, no Stripe auto-sync |

---

## ✅ What Sarah Appreciated

### 1. Status Lifecycle is Well-Designed
> "The 9-status system (draft → sent → due_soon → overdue → promised → paused → partial → paid → archived) maps to real AR workflows. Most simple tools only have 3-4 states. This shows the developer understands billing."

- `getInvoiceEffectiveStatus()` auto-transitions based on date math — reduces manual work
- Promise-to-Pay and Paused states handle real-world scenarios (client says "paying next week", or dispute in progress)

### 2. AI Reminder Tone Escalation Logic
> "The automatic tone recommendation is smart. Overdue by 3 days → Professional. Overdue by 14+ days → Final Notice. This matches the escalation ladder I use in Excel today."

- `getFollowupRecommendation()` uses a clean decision tree
- Follow-up history prevents double-chasing
- Reminder count tracking is essential for accounts receivable

### 3. Connectivity Monitor
> "The offline detection toast is a nice touch. In my previous tool, I'd submit a form on bad WiFi and it would silently fail. At least here I get a warning."

### 4. Settings Architecture — Business Profile
> "The business profile section (company name, address, tax ID, bank details, logo) covers the basics. The payment terms dropdown (Net 15/30/60/90) is standard and correct."

---

## ❌ Problems Sarah Found

### 🔴 Critical: ZERO Reporting / Analytics
> "There is literally no reporting. No aging report. No revenue by month. No collections rate. No outstanding by client. For a billing tool, this is unacceptable at any professional level."

- **Where:** Entire application — no reporting page exists
- **Impact:** ABSOLUTE DEALBREAKER for any operations role
- **Expected (minimum):**
  - **Aging Report:** 0-30 days, 31-60 days, 61-90 days, 90+ days buckets
  - **Revenue Summary:** This month vs last month vs YTD
  - **Collections Rate:** % of invoices paid on time
  - **Outstanding by Client:** Who owes the most?
  - **Monthly Trend Chart:** Invoice volume and payment trends
- **Current:** Dashboard has 4 stat cards (Unpaid, Overdue, Due This Week, Clients to Chase) — this is a summary, not reporting

### 🔴 Critical: No Data Export
> "I can't get any data out of this system. No CSV export, no PDF batch download, no API. If I need to send a report to the CFO, I literally have to screenshot the dashboard."

- **Where:** Entire application
- **Impact:** Cannot integrate with accounting software, cannot do financial reporting
- **Expected:**
  - CSV export (invoices, clients, payments)
  - PDF batch export (all invoices for a date range)
  - API access for accounting software integration

### 🔴 Critical: No Sequential Invoice Number Enforcement
> "In most jurisdictions, invoice numbers must be sequential and never have gaps. If I delete invoice #INV-005, the next one should still be #INV-006, not #INV-005 again. There's no server-side sequence enforcement."

- **Where:** Invoice creation flow
- **Impact:** Tax compliance risk — non-sequential invoice numbers can trigger audit flags
- **Expected:** Server-generated sequential numbers, no manual override, no gaps allowed
- **Current:** Client-side generated, fully editable, no uniqueness check

### 🔴 Critical: No Tax / VAT / GST Support
> "Every invoice I send must have: Subtotal, Tax (with label and rate), and Total. The Smart Builder has none of this. The settings have default_tax_label and default_tax_rate fields but they're completely unused in the invoice creation flow."

- **Where:** Smart Builder & PDF document
- **DB fields exist but unused:** `default_tax_label`, `default_tax_rate` in profiles table
- **Impact:** Legally non-compliant invoices in most countries

### 🟡 Major: No Aging Buckets Anywhere
> "I need to know: how much is 0-30 days overdue ($X), 31-60 days ($Y), 61-90 days ($Z), 90+ days ($W). This is THE fundamental metric for accounts receivable. The dashboard only shows one flat 'Overdue' number."

- **Where:** Dashboard stats
- **Expected:** Aging bucket widget with clickable segments
- **Current:** Single `totalOverdue` number with no breakdown

### 🟡 Major: No Payment Recording / Receipts
> "When a client makes a partial payment, I need to record: date, amount, method (check/wire/Stripe), reference number. The current 'Change Status → Partial → Amount Paid' is a single number with no history."

- **Where:** Invoice Detail → Change Status dialog
- **Expected:** Payment ledger per invoice
- **Current:** Single `amount_paid` field, no transaction log

### 🟡 Major: Reminder History Needs Better Audit
> "The reminder event log shows 'Generated Professional draft' and 'Copied draft to clipboard'. But it doesn't record WHAT was sent. If a client disputes, I need to prove exactly what reminder text was sent on what date."

- **Where:** Reminder events table
- **Expected:** Full draft text archived with each event
- **Current:** Only event type, tone, and subject are logged — body text is not persisted

### 🟡 Major: No Overdue Notifications / Alerts
> "I only see overdue invoices if I open the app and look at the dashboard. There are no email alerts, no push notifications, no weekly digest. For 80+ invoices, manual checking is not scalable."

- **Where:** Notification system (doesn't exist)
- **Expected:** Email digest: "You have 8 invoices overdue totaling $32,000"
- **Current:** Reminder schedule exists in settings but only for auto-generation, not user alerts

### 🟠 Minor: Sidebar "Acme Tenant Switcher" is Fake
> "There's a button at the bottom of the sidebar that says 'Acme'. I clicked it expecting to switch organizations. It just goes to Settings. This is misleading."

- **Where:** Sidebar bottom section (line ~84-98)
- **Impact:** Confusion — implies multi-org support that doesn't exist

### 🟠 Minor: No Credit Notes / Refunds
> "If I issue an invoice and the client overpays or we give a refund, I need to create a credit note. There's no mechanism for negative invoices or credit memos."

### 🟠 Minor: DEBUG Error Page in Production
> "When an invoice ID doesn't exist, I see a red box that says 'DEBUG 404 ERROR' with a raw JSON dump. This is a developer debug screen visible to end users."

- **Where:** `/invoices/[invoiceId]/page.tsx` line 121-125
- **Impact:** Unprofessional, potential data leak
- **Fix needed:** Replace with a clean 404 page

---

## 🔧 Sarah's Feature Wishlist (Priority Order)

1. **Aging report** — 0-30, 31-60, 61-90, 90+ day buckets
2. **CSV export** — All invoices with status, dates, amounts
3. **Tax / VAT support** — Per-invoice and global defaults
4. **Sequential invoice numbers** — Server-enforced, no gaps
5. **Payment ledger** — Per-invoice transaction log
6. **Email digest alerts** — Weekly overdue summary
7. **Revenue dashboard** — Monthly trend charts
8. **Bulk operations** — Select multiple → bulk remind, bulk export
9. **Credit notes** — Negative invoices / refund tracking
10. **Accounting integration** — QuickBooks / Xero sync via API
11. **Audit log** — Full text of every reminder sent
12. **Remove DEBUG 404 page** — Immediate fix

---

## 💡 Sarah's Verdict
> "This tool has a clear vision — AI-powered payment follow-up — and that specific feature is excellent. The tone escalation, variant generation, and Gmail/Outlook integration are all genuinely well-executed. But as a professional billing tool, it's missing the foundations: reporting, export, tax, audit trails, and sequential numbering. Right now it's a 'payment chaser' not an 'invoicing platform'. The developer should decide: is this a focused reminder tool that plugs into QuickBooks, or a full invoicing platform that replaces QuickBooks? Both paths are valid, but the current state is stuck in between."
