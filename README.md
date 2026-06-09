<div align="center">

# ChaseFree AI

**Your AI-Powered Invoicing Assistant for Stress-Free Payment Tracking**

![ChaseFree AI Dashboard](https://ik.imagekit.io/a57jpcchpv/chasefree/ChaseFree_ai_github_hero_image_.png?updatedAt=1781013112995)

</div>

## ✨ Features
- **Smart Invoicing:** Create, customize, and send professional invoices in seconds.
- **Automated Payment Tracking:** Keep track of who owes you what with a clear, intuitive dashboard.
- **AI-Powered Reminders:** Instantly draft perfectly-toned follow-up emails for overdue payments using advanced AI (NVIDIA NIM).
- **One-Click Gmail Integration:** Seamlessly send your AI-drafted reminders directly through Gmail without leaving the app.
- **Freelancer Focused:** Designed specifically for solo freelancers and small agencies to reduce the anxiety of chasing payments.
- **Secure & Private:** Enterprise-grade security with Supabase Row-Level Security (RLS) to keep your client data safe.

## 📸 Screenshots & Demo

### Dashboard
![Dashboard Screenshot](https://ik.imagekit.io/a57jpcchpv/chasefree/ChaseFREE_ai_dassboard_image.jpeg?updatedAt=1781013175851)

### Client & Invoice Creation
![Add Client & Invoice Creation](https://ik.imagekit.io/a57jpcchpv/chasefree/ChaseFREE_ai_invoice_page_image.png)

### AI Reminder Generation
![Generate AI Reminder](https://ik.imagekit.io/a57jpcchpv/chasefree/Chasefree-ai-ai_reminders-page-image.png)

**Live Demo:** [Link Placeholder]

## 📋 Table of Contents
- [✨ Features](#-features)
- [📸 Screenshots & Demo](#-screenshots--demo)
- [About The Project](#about-the-project)
- [🚀 Tech Stack](#-tech-stack)
- [🛠️ Getting Started](#️-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)

## About The Project

### The Problem
Chasing late payments is one of the most stressful and awkward parts of being a freelancer. It causes anxiety, wastes valuable time, and can negatively impact client relationships. 

### Why ChaseFree AI?
ChaseFree AI was built to completely eliminate the friction of getting paid. Instead of staring at a blank email trying to find the right words to ask for your money, ChaseFree AI does the heavy lifting. It acts as your personal billing assistant, monitoring due dates and utilizing AI to draft polite, professional, and effective reminders tailored to the situation. 

### Current Status
**MVP / Beta:** The core invoicing, AI-reminder generation, and dashboard tracking features are fully operational. Automated E2E testing using Playwright ensures a highly stable and reliable workflow.

## 🚀 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS + Radix UI (Shadcn)
- **Database & Auth:** Supabase (PostgreSQL with Row-Level Security)
- **AI Provider:** NVIDIA NIM / Llama 3.1
- **Testing:** Playwright (E2E) & Vitest (Unit)
- **Validation:** Zod
- **Forms:** React Hook Form

## 🛠️ Getting Started

### Prerequisites
Before you begin, ensure you have the following installed:
- Node.js 18.17 or later
- npm, yarn, or pnpm
- A Supabase account and project
- An NVIDIA API Key (or other supported AI provider)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/chasefree-ai.git
   cd chasefree-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory and add the necessary keys:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

   # AI Provider (NVIDIA NIM)
   NVIDIA_API_KEY=your_nvidia_api_key

   # Cloudflare Turnstile (Authentication Security)
   NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_site_key
   TURNSTILE_SECRET_KEY=your_secret_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

5. **Run Tests (Optional)**
   Verify the installation by running the E2E test suite:
   ```bash
   npx playwright install
   npm run test:e2e
   ```
