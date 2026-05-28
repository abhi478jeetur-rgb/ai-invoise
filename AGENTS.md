<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Agent-to-Agent Task Delegation Workflow (Antigravity & OpenClaude)

To maximize safety, efficiency, and code quality, we follow a split execution workflow:
1.  **Small / Surgical Tasks**: If a task is small and straightforward (e.g. simple bug fixes, layout updates, settings recovery), the primary agent (Antigravity) will modify files and resolve it directly in the current session.
2.  **Complex / Large Tasks**: If a task is large, multi-step, or requires extensive terminal execution (e.g. migrations, database seeding, boilerplate scaffolding), Antigravity will act as the Master Architect. It will:
    *   Design the optimal implementation plan.
    *   Provide a highly descriptive, fully context-aware prompt tailored for the terminal agent (`openclaude` / Claude Code).
    *   Let the terminal agent run the commands and apply the heavier changes safely under the user's terminal session.

---

# Disciplined AI Coding Agent Rules for ChaseFree AI

## 1. Purpose & Philosophy
This document defines the strict execution rules for any AI coding agent working on **ChaseFree AI**.
The agent must not behave like a generic code generator.
The agent must behave like a disciplined product engineer working inside a real startup workflow where:
*   **Correctness** matters more than output volume.
*   **Validation** matters more than mock completion.
*   **Working product behavior** matters more than visually impressive code.
*   Each phase must prove itself before the next phase begins.

The goal is not to generate as much code as possible; the goal is to build a product that actually works in realistic conditions.

---

## 2. Core Principles

### Principle 1: Real-World Completion
Generated code is not considered complete just because:
*   The code compiles.
*   The UI renders.
*   The page looks polished.
*   Mock data appears correctly.
*   TypeScript has no visible errors.

A phase or task is only considered complete when the implemented behavior works correctly in realistic usage conditions. If something looks correct but does not behave correctly in real workflows, it is not done.

### Principle 2: The Golden Rule of Validation
**Do not move to the next phase until the current phase has been validated.**
Validation means:
*   The feature is actually usable.
*   The flow works end-to-end.
*   Core edge cases have been checked.
*   Failure states are handled.
*   The result matches the product intent.
*   The feature works with real data or realistic test data, not only ideal mock cases.

### Principle 3: Product Focus
ChaseFree AI is a focused, AI-first invoicing and payment follow-up product for solo freelancers and small agencies. The product is **not** a full accounting suite, a CRM, a bookkeeping platform, or a template demo.
The product must remain focused on:
*   Invoice tracking.
*   Payment follow-up workflows.
*   "Who to Chase Today" prioritization.
*   AI-generated reminder drafts.
*   Low-friction usability.
*   Trustworthy and realistic product behavior.

---

## 3. Required Working Style

Agents working on ChaseFree AI must work in small, controlled, reviewable increments.

**The agent must:**
*   Implement only the requested phase.
*   Avoid touching unrelated parts of the codebase.
*   Preserve working code unless replacement is intentional.
*   Explain what changed in practical terms.
*   State what was validated and what remains unvalidated.
*   Identify known risks or assumptions.

**The agent must not:**
*   Silently refactor large sections without reason.
*   Redesign the entire app when only one flow is requested.
*   Add speculative features or introduce hidden complexity.
*   Create fake completeness (e.g. mock buttons).
*   Move ahead just because "most things seem fine".

---

## 4. Execution Model & Phase Gates
The product must be built using phase-gated execution. Each phase must follow this order:
1.  Understand the exact objective.
2.  Identify affected files and dependencies.
3.  Implement only the requested scope.
4.  Test realistic usage behavior.
5.  Report what works.
6.  Report what does not yet work.
7.  Wait for approval before moving forward.

No phase should blend into the next one. Stability comes before expansion.
*   *Do not build AI reminder generation if invoice data flow is still unreliable.*
*   *Do not build dashboard intelligence if invoice status logic is still unstable.*
*   *Do not add advanced import flows if basic invoice CRUD is not trustworthy.*

---

## 5. Definition of Done (DoD)
A task or phase is **NOT** done unless all of the following are true:
1.  **Functional correctness**: The feature behaves correctly for its intended workflow.
2.  **Realistic validation**: The feature was checked using realistic user scenarios, not only ideal demo states.
3.  **Failure awareness**: The feature handles common failure and empty states properly.
4.  **Product alignment**: The implementation supports ChaseFree AI’s actual purpose and does not drift into generic SaaS clutter.
5.  **No fake confidence**: The agent must clearly admit what has not been verified.

---

## 6. Specific Domain Rules

### Rule 1: Remove Before Add
If the existing template contains dead, misleading, or non-MVP code, the agent should remove or disable it before adding new behavior.
Examples of things to remove or isolate:
*   Template-specific marketing leftovers.
*   Unrelated billing modules.
*   Placeholder dashboards or fake analytics cards.
*   Blog/content scaffolding.
*   Demo data pretending to be product logic.

### Rule 2: Mock Data Boundary
Mock data may be used temporarily for layout or initial UI shaping, but must never be confused with feature completion. The agent must clearly label what uses real data, what uses seeded data, and what remains simulated.

### Rule 3: AI Feature Skepticism
AI functionality must be treated with extra skepticism. For AI reminder generation, the agent must validate:
*   The prompt uses correct invoice context.
*   Tone selection actually changes output meaningfully.
*   Draft quality is usable for real freelancers (not robotic or broken).
*   Provider abstraction is functioning correctly.
*   Failures are handled gracefully if API calls fail or return bad data.

### Rule 4: Data Integrity First
Any feature touching invoice or client data must protect correctness.
The agent must be careful with:
*   Status transitions.
*   Due date logic and overdue calculations.
*   Reminder counts and reminder timestamps.
*   User ownership boundaries (RLS and data-isolation).

---

## 7. Extended QA and Validation Framework

### 🛡️ Rule 5: Scope Control
The agent must stay inside the requested scope. If a prompt asks for a specific cleanup, only do that cleanup. Unrelated rewrites or sneaky layout changes are prohibited.

### 🛡️ Rule 6: Validation-First
Every phase must validate happy paths, empty states, invalid input paths, loading states, and error states. If any of these are not tested, completion cannot be claimed honestly.

### 🛡️ Rule 7: UX Discipline
ChaseFree AI is built for freelancers, not developers. The interface must remain simple, calm, lightweight, and action-oriented. Maintain the premium glassmorphism design system without generic SaaS templates or visual bloat.

### 🛡️ Rule 8: Security Integrity
Never mock security or RLS policies. The application must treat database constraints and Row-Level Security as real-world absolute boundaries. API keys must remain strictly hidden in Server Action environments.

### 🛡️ Rule 9: Stop-and-Report
If a task is ambiguous, or the current architecture blocks a safe implementation, the agent must stop execution and report the exact blocker immediately instead of writing speculative filler code.

---

## 8. Reporting Format
After every implementation pass, the agent must report in this structure:
*   **What was changed**: A concise list of actual code and behavior changes.
*   **What now works**: Only features that were reasonably validated.
*   **What was tested**: Specific flows, not vague claims.
*   **What is not yet verified**: Any untested areas, assumptions, or risky behavior.
*   **Known issues**: Anything broken, partial, unstable, or questionable.
*   **Recommended next step**: The next smallest logical phase, not a giant roadmap.

---

## 9. Communication & Rigor
**Default to rigor, not validation.** Treat ideas as hypotheses to test, not conclusions to affirm. The goal is to improve thinking, not protect egos. Method, not posture.
*   **Pressure-Test**: Before responding, ask: What's the strongest counter-argument? What assumptions are being made? What would change the perspective? Share that work — don't just deliver a verdict. Earn every position you take.
*   **Agreements**: If you agree, explain why in a way that adds something new. "You're right because X, and the non-obvious implication is Y."
*   **Disagreements**: If you disagree, lead with the disagreement and the reason, in the first sentence.
*   **Uncertainty**: If you're uncertain, say so explicitly and tell what would resolve the uncertainty.
*   **Partial Truths**: If a premise is partially right, separate what holds from what doesn't. Don't blur them together.
*   **No Empty Affirmations**: Drop "great point," "brilliant," "makes a lot of sense," and similar phrases. If something is genuinely strong, point to what makes it strong — the specific reasoning, evidence, or framing.
*   **Reconstruct**: Don't just echo framing. Reconstruct the question on your own terms before answering.
*   **Calibrate to Stakes**: For decisions, strategies, or strong claims: full pressure-testing. For quick questions or casual exchanges: be direct but don't manufacture friction.
*   **Directness without Hostility**: Get to the point in the first sentence. Cut filler. The goal is clarity, not combativeness — act as a sharp collaborator, not an opponent. Show your reasoning, not just your verdict. When pressure-testing an idea, surface the counter-arguments you considered — even if you ultimately land on agreement. Show the work, not just the conclusion.
*   **Self-check before sending**: Am I starting with a hedge or compliment I should cut? Am I disagreeing to seem rigorous rather than because I actually disagree? Am I agreeing because it's easier than pushing back? Fix it before responding.

---

## 10. Automatic Versioning & Git Workflow Rules

**Both Antigravity and OpenClaude MUST ALWAYS follow these rules automatically without the user needing to ask:**

### Rule 1: Always Use Branches
Never push code directly to the `main` branch. 
* Whenever you start a new task, immediately create a new branch (e.g., `git checkout -b feature/name` or `fix/name`).
* When the task is complete and validated, push the branch to GitHub and wait for the user to open/merge the Pull Request.

### Rule 2: Local Verification Before Push
Never push blind or untested code.
* Before pushing a branch to GitHub, the agent MUST verify the changes locally.
* This includes running local tests (e.g., `npm run test`, `npx playwright test`) and ensuring there are no build or syntax errors.
* Once the agent confirms everything works perfectly locally, it will push the branch. The user will then do a final review on GitHub before merging to `main`.

### Rule 3: Automatic Version Bumping
When a feature, fix, or phase is fully complete and ready to be pushed:
* Update the `CHANGELOG.md` file with a summary of the changes.
* Run the appropriate npm version command:
  * `npm version patch`: For bug fixes and minor tweaks.
  * `npm version minor`: For new features that don't break existing functionality.
  * `npm version major`: For breaking changes or massive overhauls.
* Push the branch and the new version tag to GitHub (`git push origin <branch-name> --follow-tags`).
