# Backend Scalability & Architecture PRD
**Target Application:** `ai-invoise`
**Status:** Audit Complete
**Prepared by:** AI Scalability Agents & Senior Architect

---

## 1. Executive Summary
The current backend architecture functions well for a limited number of users but contains critical architectural anti-patterns that will cause the application to crash or face severe performance degradation when scaled to 10,000+ concurrent users. This document outlines the mandatory fixes required to achieve enterprise-grade stability.

## 2. Critical Vulnerabilities & Bottlenecks (Fix Immediately)

> [!WARNING]
> **Lack of Global Rate Limiting**
> While rate limiting exists in AI generation routes (`enforceRateLimit`), it is missing on critical read/write endpoints and auth endpoints. This leaves the system vulnerable to DDoS attacks and rapid database exhaustion.

> [!CAUTION]
> **Synchronous LLM Calls without Queueing**
> AI requests (like `generateMultipleDraftsAction`) are blocking server actions. If 1,000 users click "Generate Reminders" simultaneously, it will exhaust Vercel Serverless Function timeouts (10s-30s max) and lead to mass HTTP 504 Gateway Timeouts.

## 3. What NOT To Do (Current Anti-Patterns)

1. **Inline Database Updates for Analytics:**
   - *Current State:* Logging events (`reminder_events`) inline within the user request lifecycle.
   - *Why it's bad:* Slows down the user response.
   - *Correction:* Offload analytics and logging to background jobs or edge queues.

2. **Over-fetching in Supabase Queries:**
   - *Current State:* `select('*')` is used in multiple places.
   - *Why it's bad:* Consumes unnecessary bandwidth and memory.
   - *Correction:* Always specify the exact columns needed (e.g., `select('id, amount, status')`).

3. **Mixing Raw SQL and RPCs Fallbacks Inline:**
   - *Current State:* Falling back to `update` when RPC `increment_reminder_count` fails. 
   - *Why it's bad:* Creates race conditions under high concurrency.
   - *Correction:* Ensure the RPC exists via migrations. Do not rely on application-level race-prone fallbacks.

## 4. API Optimization Strategy

### A. Frequency & Caching
- **What to Cache (Redis / Next.js Data Cache):** User profiles, global business rules, and knowledge base documents. These rarely change and should not hit the database on every generation.
- **Cache Invalidation:** Only invalidate the cache when the user explicitly updates their settings.
- **Client-Side Throttling:** Debounce all search and filtering inputs on the client to prevent rapid-fire DB queries.

### B. Payload Optimization
- Paginate all lists (`/invoices`, `/clients`) with strict limits (e.g., `LIMIT 50`).
- Use Edge Functions for lightweight API checks (e.g., Auth verification) to reduce cold starts on Serverless functions.

## 5. Technical Execution Plan

| Phase | Task | Priority |
|---|---|---|
| **Phase 1** | Implement global Upstash Redis rate limiting for all authenticated routes. | HIGH |
| **Phase 2** | Refactor AI generation to use a queuing mechanism (e.g., Inngest / Trigger.dev). | HIGH |
| **Phase 3** | Replace all `select('*')` queries with specific column names. | MEDIUM |
| **Phase 4** | Implement Next.js `unstable_cache` for User Profiles and Knowledge Base. | MEDIUM |
| **Phase 5** | Move non-critical database writes (event logging) to `after()` callbacks or background workers. | LOW |

---
**Approval Required:** Please review this PRD. Once approved, the engineering team will begin executing Phase 1 and 2 immediately.
