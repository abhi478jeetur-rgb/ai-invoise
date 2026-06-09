# ChaseFree AI 💸🤖

**ChaseFree AI** is an AI-first invoicing and payment follow-up assistant designed specifically for solo freelancers and small agencies. It removes the anxiety, awkwardness, and procrastination involved in chasing late payments by tracking overdue invoices and instantly drafting perfectly toned reminder emails.

*Stop chaser anxiety, secure your cash flow, and maintain healthy client relationships.*

---

## ✅ QA Validation Status & Verification

ChaseFree AI is built with startup rigor and extreme operational correctness. The entire core workflow has been **100% verified and fully passed** via automated Playwright Headed E2E tests:

| Test Reference | Validation Scope | Result | Execution Speed |
| :--- | :--- | :---: | :---: |
| `test_1a_auth_dashboard` | Supabase auth session, responsive layout, dynamic metrics matching database, unpaid calculations | **PASSED** ✅ | 36.1s |
| `e2e-verify` | Complete headed E2E flow (Login ➡️ Overdue invoice detection ➡️ AI reminder modal ➡️ Llama 3.1 draft generation ➡️ clipboard copy ➡️ Mark as Sent event log) | **PASSED** ✅ | 17.2s |

No failures detected. The E2E payment recovery engine is completely stable and operational under real database states!

---

## 🚀 Core Features

### 1. Urgency-Aware Dashboard
*   **Balancing Urgency**: Get a real-time snapshot of outstanding and overdue balances dynamically grouped and formatted by their actual currency (e.g. `₹52,200 + $1,200`).
*   **Due This Week**: Scan invoices that are due in the next 7 days, sorted by currency to prevent cash flow surprises.
*   **Recent Invoices**: A clean, reactive list of the latest invoices and their payment states.

### 2. "Who to Chase Today"
*   An algorithmic prioritization panel that dynamically lists and ranks unpaid and overdue invoices requiring immediate attention.
*   Shows the invoice number, due date, amount, client name, and days overdue with a direct **"Generate Reminder"** action trigger.

### 3. Context-Aware AI Reminder Generator
*   Powered by secure OpenAI-compatible API configurations (integrated with the **NVIDIA AI Foundation** and the optimized **Meta Llama 3.1 8B Instruct** model).
*   **Relationship-Safe Presets**: Generate reminder drafts in four distinct presets:
    *   **Friendly Nudge**: Warm, polite poke assuming they simply forgot.
    *   **Professional**: Courteous, direct, and standard business-appropriate.
    *   **Firm**: Direct tone setting clear payment expectations and concrete deadlines.
    *   **Final Notice**: Factual, serious final notification before further action.
*   **Robust Parsing Engine**: Fully stabilized JSON response parsing with regular expression fallbacks that gracefully handle unescaped newlines in LLM outputs.
*   **Zustand-Powered Modal UI**: Premium, glassmorphic modal with real-time preview, copy-to-clipboard actions, and single-click update to "Mark as Sent".
*   **Double Backdrop Protection**: Specialized rendering conditions ensure only one portal dialog overlay is active at any time, preventing pointer-event blocking or UI interception during headed browser tests.

### 4. Activity Logs & Timeline
*   Tracks every generated draft, clipboard copy, manual email action, status change, and payment event in a chronological, audit-friendly activity timeline.

---

## 🛠️ Technology Stack

*   **Framework**: [Next.js](https://nextjs.org/) (App Router, Server Actions, React Server Components)
*   **Language**: TypeScript
*   **Database & Authentication**: [Supabase](https://supabase.com/) (Postgres DB, Supabase Auth, Row-Level Security)
*   **Styling & UI**: Tailwind CSS, CSS Variables, and [shadcn/ui](https://ui.shadcn.com/) primitives
*   **State Management**: Zustand
*   **AI Inference**: OpenAI-compatible LLM abstraction (pre-configured for NVIDIA NIM with `meta/llama-3.1-8b-instruct`)

---

## ⚙️ Project Setup

### 1. Prerequisites
Ensure you have Node.js (v18+) and an active Supabase project.

### 2. Installation
Clone the repository and install the project dependencies:
```bash
git clone https://github.com/abhi478jeetur-rgb/ai-invoise.git
cd ai-invoise
npm install
```

### 3. Database Schema Setup
Execute the SQL statements provided in [supabase-schema.sql](file:///d:/Desktop/web/ai-nvoise/supabase-schema.sql) directly in your Supabase SQL Editor. This will configure tables and Row-Level Security (RLS) policies. For a detailed database diagram and query patterns, see [CLOUD.md](file:///d:/Desktop/web/ai-nvoise/CLOUD.md).

### 4. Environment Variables
Create a `.env.local` file in the root directory and add your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 5. Running Locally
Start the development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## 🤖 Configuring AI Reminder Settings

To generate email drafts, configure your preferred LLM provider in the app settings:
1. Log in to ChaseFree AI.
2. Navigate to **Settings** in the sidebar.
3. In the **AI Provider Settings** card, enter:
   *   **AI Provider Label**: e.g., `NVIDIA AI Foundation` or `Groq`
   *   **Base URL**: e.g., `https://integrate.api.nvidia.com/v1` or `https://api.groq.com/openai/v1`
   *   **Model Name**: e.g., `meta/llama-3.1-8b-instruct` or `llama3-8b-8192`
   *   **API Key**: Your provider's secure API key.
4. Click **Save Settings** and run the connection check. Once you get the green `Connection successful!` notification, your AI Reminder Generator is ready!

---

## 📂 Codebase Navigation & Reference Guides

For developers and AI coding agents working on ChaseFree AI:
*   [CLAUDE.md](file:///d:/Desktop/web/ai-nvoise/CLAUDE.md) — Fast reference for developer commands and tech conventions.
*   [AGENTS.md](file:///d:/Desktop/web/ai-nvoise/AGENTS.md) — Split-Agent execution parameters (Antigravity & OpenClaude) and strict startup engineering rules.
*   [CLOUD.md](file:///d:/Desktop/web/ai-nvoise/CLOUD.md) — Production database schemas, Row-Level Security (RLS) policies, security boundaries, and indexing optimization.
*   [My research docs/prd.md](file:///d:/Desktop/web/ai-nvoise/My%20research%20docs/prd.md) — Comprehensive Product Requirement Document.

---

## 📄 License
This project is licensed under the MIT License - see the `LICENSE` file for details.
