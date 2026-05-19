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
