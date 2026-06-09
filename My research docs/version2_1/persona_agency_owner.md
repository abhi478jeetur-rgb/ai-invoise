# 🏢 Persona Review: Small Agency Owner

> **Name:** Marcus Chen  
> **Role:** Founder & CEO, a 6-person creative agency  
> **Clients:** 15–30 active accounts  
> **Invoice volume:** 25–40 invoices/month, mixture of project-based and retainer  
> **Pain points:** Needs team visibility, multi-currency billing, partial payments, and professional branding on invoices  
> **Tech comfort:** High — uses Slack, Linear, Figma, QuickBooks (wants to replace), Stripe  

---

## 📊 Overall Score: 6.2 / 10

| Area | Score | Notes |
|------|-------|-------|
| First Impression & Onboarding | 7/10 | Clean, but no team/org concept |
| Invoice Creation (Smart Builder) | 6/10 | Single-user oriented, no approval flow |
| Dashboard Usefulness | 7/10 | Good for personal overview, bad for team |
| AI Reminders | 8/10 | Great, but can't delegate to team |
| PDF Branding & Customization | 4/10 | No theme, no color, no font control |
| Client Management | 4/10 | No client-level billing summary |
| Multi-Currency Support | 5/10 | Free-text currency is risky |
| Partial Payments | 6/10 | Status exists but no payment breakdown |
| Settings & Configuration | 6/10 | Business profile is good, but limited |
| Scalability for Team Use | 2/10 | Completely single-user architecture |

---

## ✅ What Marcus Liked

### 1. Dashboard Visual Customizer — Theme Presets
> "The theme presets are a nice touch. I set it to 'Charcoal Slate' with blue accents — matches our agency brand. Most invoice tools look the same; this feels like mine."

- 4 theme presets (Midnight Dark, Charcoal Slate, Nordic Light, Retro Amber)
- Persists to localStorage — survives browser restarts
- CSS variable injection (`--user-bg`, `--user-card`, etc.) is architecturally clean

### 2. Live PDF Preview in Smart Builder
> "I can see the PDF updating as I type. That's a feature I haven't seen in QuickBooks. Genuinely impressive for a solo tool."

- Real-time `react-pdf/renderer` preview on the right pane
- Updates on every keystroke — no "preview" button needed
- Split-pane layout (form left, PDF right) is intuitive

### 3. Unbilled Scratchpad → Invoice Pipeline
> "My team logs work in Notion, but I could see us logging unbilled tasks here and converting them to invoices. The 'arrow' button that creates an invoice from a task is clever."

### 4. Status Transition System
> "I can go from Draft → Sent → Due Soon → Overdue → Paid → Archived. The status flow makes sense. The 'Promised to Pay' and 'Paused' states are realistic additions most tools don't have."

- 9 status states: draft, sent, due_soon, overdue, promised, paused, partial, paid, archived
- `getInvoiceEffectiveStatus()` auto-calculates due_soon and overdue based on date — smart

### 5. Knowledge Base Documents
> "I uploaded our agency's payment terms PDF and our standard contract. If the AI reminders can reference these, that's powerful context."

- Settings → Knowledge Base section supports document uploads
- Stored per-user for AI context enrichment

---

## ❌ Problems Marcus Found

### 🔴 Critical: No Multi-User / Team Support
> "This is a single-user app. I can't invite my project manager to create invoices, and I can't give my accountant read-only access. For an agency, this is a non-starter."

- **Where:** Entire architecture
- **Impact:** DEALBREAKER for any agency with >1 person
- **Expected:** Invite team members, role-based access (Admin, Billing, Viewer)
- **Current:** Supabase RLS is per-user (`user_id`), no `org_id` concept
- **Note:** Sidebar shows "Acme Tenant Switcher" but it's hardcoded — not functional

### 🔴 Critical: No PDF Theme / Branding Customization
> "Our invoices need to use our brand colors (navy + gold), our font (Satoshi), and our watermark. The current PDF is white and plain — it looks like a Google Docs export."

- **Where:** `invoice-pdf-document.tsx` — hardcoded styles
- **Impact:** Agency invoices represent the brand. Generic PDFs undermine credibility.
- **Expected:** 
  - Color theme picker (accent color, header color)
  - Font selection (3-4 options)
  - Logo positioning options (left, center, header bar)
  - Footer customization
- **Current:** Fixed layout, fixed colors, logo top-left only

### 🔴 Critical: Partial Payment Has No Breakdown
> "I billed $10,000. Client paid $4,000 upfront. I marked it as 'Partial' and entered $4,000 in the dialog. But there's no visible payment history — just the status label. Where did the $4,000 go?"

- **Where:** Invoice Detail → Change Status dialog (partial payment)
- **Impact:** No audit trail for partial payments. `amount_paid` field exists in DB but isn't displayed anywhere
- **Expected:** 
  - Payment log: "Jun 1: $4,000 received (Stripe)" / "Jun 15: $6,000 received"
  - Remaining balance: $10,000 - $4,000 = $6,000 outstanding
  - PDF should show "Amount Paid: $4,000 / Balance Due: $6,000"
- **Current:** Just a status badge change, no breakdown shown

### 🟡 Major: No Recurring / Retainer Invoice Support
> "60% of our revenue is monthly retainers. I need to create a $5,000/month invoice for 'Acme Corp' automatically on the 1st of each month. There's no recurring option."

- **Where:** Invoice creation flow
- **Expected:** "Repeat: Monthly / Quarterly / Custom" option
- **Impact:** High — agency owners spend 30+ minutes/month recreating the same invoices

### 🟡 Major: No Client-Level Financial Summary
> "I clicked on a client and got their name and email. I expected to see: Total Billed ($45,000), Total Paid ($38,000), Outstanding ($7,000), and a list of all their invoices."

- **Where:** `/clients/[clientId]` page
- **Currently shows:** Just contact info card
- **Expected:** 
  - Financial summary widget
  - Invoice history table filtered to that client
  - Last payment date
  - Payment reliability score

### 🟡 Major: Dashboard Currency is Hardcoded to USD
> "We bill in USD, EUR, and GBP. The dashboard shows all amounts in USD regardless. The 'Unpaid' card shows '$18,500' but that's mixing USD and EUR invoices. That number is meaningless."

- **Where:** `visual-customizer.tsx` line ~139: `formatCurrency` hardcodes USD
- **Impact:** Misleading financial data for multi-currency agencies
- **Expected:** Either show per-currency breakdowns or let user set a "reporting currency"

### 🟠 Minor: No Bulk Actions on Invoice List
> "I have 40 invoices. I want to select 5 overdue ones and bulk-send reminders. There's no checkbox, no bulk action bar."

### 🟠 Minor: No Export / Reporting
> "At month-end, I need a CSV of all invoices for my accountant. There's no export button anywhere."

- **Where:** Invoices list page
- **Expected:** "Export CSV" button with date range filter
- **Current:** No export functionality exists

### 🟠 Minor: Trash Has No Auto-Delete
> "I moved 15 invoices to trash over 3 months. They're all still there. There should be auto-delete after 30 days."

### 🟠 Minor: Search Only Works Within Current Page
> "The search on the Invoices page only searches invoices. I wanted to search across everything — clients, invoices, amounts."

---

## 🔧 Marcus's Feature Wishlist (Priority Order)

1. **Team / Organization support** — Multi-user with roles
2. **PDF branding** — Colors, fonts, logo placement, footer
3. **Partial payment tracking** — Payment history log with audit trail
4. **Client financial summary** — Billing overview per client
5. **Multi-currency dashboard** — Per-currency stats or reporting currency
6. **Recurring invoices** — Auto-create on schedule
7. **Bulk actions** — Multi-select + bulk remind / bulk status change
8. **CSV export** — Monthly reporting for accountants
9. **Invoice approval workflow** — Draft → Review → Approved → Sent
10. **Stripe/PayPal integration** — Auto-mark paid when payment received

---

## 💡 Marcus's Verdict
> "As a personal invoice tracker with AI follow-ups, this is genuinely good — maybe the best I've seen in this category. But the moment you have a team of 2+, it falls apart. No roles, no shared access, no PDF branding, no partial payment history. I'd use this for my personal freelance side-projects, but not for my agency. Add team support and PDF customization, and this becomes a serious QuickBooks/FreshBooks competitor for small agencies."
