You are tasked with conducting a comprehensive UI/UX Animation Audit of the `ai-invoise` application.

## OBJECTIVE
Search the entire codebase autonomously to identify components and pages where user experience can be significantly improved using **Framer Motion** and **GSAP**. 

## STRICT RULES (MANDATORY)
1. **DO NOT MODIFY ANY CODE.** This is a read-only audit. You must not change, refactor, or dirty the codebase in any way.
2. Focus on finding areas for micro-interactions, page transitions, and interactive feedback.
3. Specifically, look into the "AI Reminder" feature. The user wants a dynamic loading state there where text changes repeatedly (e.g., "Analyzing...", "Drafting email...", "Polishing tone...") so the user knows work is happening.
4. Output your findings into a detailed Markdown file named `ui-ux-animation-audit.md` in the root of the project.

## WHAT TO INCLUDE IN `ui-ux-animation-audit.md`
- A list of files/components that need animations.
- The type of animation proposed (e.g., GSAP scroll trigger, Framer Motion hover scale, AnimatePresence for modals).
- Specific details for the AI Reminder dynamic text animation.
- A strategic roadmap for how we will implement these in the next phase without breaking the UI.

Please execute this audit now and generate the file.
