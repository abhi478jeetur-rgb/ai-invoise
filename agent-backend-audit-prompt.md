You are tasked with conducting a highly critical **Backend Scalability & Architecture Audit** for the `ai-invoise` application, acting as a strict Senior Backend Engineer. 

## OBJECTIVE
Analyze the entire codebase autonomously to identify non-professional backend practices, scalability bottlenecks, and vulnerabilities that could cause the application to crash if it hits 10,000+ concurrent users.

## AUDIT FOCUS AREAS
1. **API Optimization & Frequency:** Identify which API calls are being made redundantly or too frequently. Define what API calls MUST be made on every request vs. what should be cached.
2. **Database & ORM Efficiency:** Look for N+1 query problems, missing indexes, inefficient Supabase queries, and missing rate-limiting.
3. **Crash Prevention:** Identify unhandled exceptions, synchronous blocking operations, memory leaks, and edge cases.
4. **Professional Best Practices:** Enforce strict adherence to enterprise backend standards.

## DELIVERABLE
Synthesize your findings into a highly detailed **Product Requirements Document (PRD)**.
Save your output in a file named `backend-scaling-prd.md` in the root of the project.

The PRD must include:
- Executive Summary of Current Architecture Risks.
- What to FIX immediately (Critical Vulnerabilities & Bottlenecks).
- What NOT TO DO (Anti-patterns currently found in the codebase).
- A concrete API Strategy (Throttling, caching, payload optimization).
- A step-by-step Technical Execution Plan.

**DO NOT** modify any existing source code. Your job is ONLY to read, analyze, and generate the `backend-scaling-prd.md` file.
