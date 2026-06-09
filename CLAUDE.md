# CLAUDE.md

## Developer Reference & Guidelines for ChaseFree AI

This document serves as a developer guide for ChaseFree AI, detailing common development commands, styling guidelines, and engineering conventions.

---

## 1. Core Developer Commands

### Development Server
```bash
npm run dev
```

### Build & Production Test
```bash
npm run build
npm run start
```

### Code Linting
```bash
npm run lint
```

### Graphify Knowledge Graph
Keep the local codebase representation synchronized. Run this after changing or adding files:
```bash
graphify update .
```

---

## 2. Technology Stack & Key Conventions

*   **Framework**: Next.js (App Router, Server Actions, React Server Components).
*   **Database**: Supabase Postgres (Row Level Security active on all user-owned tables).
*   **Styling**: Tailwind CSS & shadcn/ui primitives. Clean, calm, modern glassmorphic theme tailored for freelancers.
*   **State Management**: Zustand and React Server State.
*   **AI Integration**: Provider-agnostic server action layer routing requests to OpenAI-compatible endpoints (e.g., NVIDIA NIM, Groq).

---

## 3. Strict Development Standards

*   **Split-Agent Workflow**: Under `AGENTS.md`, Antigravity acts as the Master Architect/Manager, while `openclaude` (Claude Code) acts as the execution agent for terminal commands and heavy coding.
*   **Disciplined Coding**: Always prioritize correctness over output volume. Never assume mock UI is complete. Features are only complete when they work end-to-end with realistic database states.
*   **Row-Level Security (RLS)**: Every single table must possess active RLS policies checking `auth.uid() = user_id`.
*   **No Auto-Pilot AI**: All AI features must remain "Human-in-the-loop." Drafts are suggested, never sent autonomously.
*   **Currency Awareness**: Always use the actual invoice currency rather than hardcoded formatting.
*   **Structured Outputs**: AI provider integration must generate structured JSON drafts with a robust regex fallback to prevent unescaped newline parsing failures.

---

## 4. References & Documentation
Additional project insights are available in:
*   [AGENTS.md](file:///d:/Desktop/web/ai-nvoise/AGENTS.md) — Task Delegation & Strict Agent Rules
*   [My research docs/prd.md](file:///d:/Desktop/web/ai-nvoise/My%20research%20docs/prd.md) — Product Requirement Document
*   [My research docs/Supabase Schema.md](file:///d:/Desktop/web/ai-nvoise/My%20research%20docs/Supabase%20Schema.md) — Database Schema Reference
*   [My research docs/# AI Integration.md](file:///d:/Desktop/web/ai-nvoise/My%20research%20docs/%23%20AI%20Integration.md) — Complete AI Draft Guidance
