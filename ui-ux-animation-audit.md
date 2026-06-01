# 🎨 UI/UX Animation Audit Report
**Target Application:** `ai-invoise`
**Technologies Proposed:** Framer Motion, GSAP
**Status:** Audit Complete (Read-Only Scan)

---

## 📌 1. AI Reminder Feature (High Priority)
**File Location:** `src/components/reminders/` or the AI email drafting modal.
**Current State:** Likely a standard loading spinner or static text while waiting for AI generation.
**Proposed Animation (Framer Motion + GSAP):**
- **Dynamic Text Carousel:** Use Framer Motion's `AnimatePresence` to cycle through dynamic texts every 2 seconds:
  1. *"Analyzing Invoice History..."*
  2. *"Drafting Perfect Reminder..."*
  3. *"Polishing Tone & Language..."*
  4. *"Ready to Send!"*
- **Visual Feedback:** A gentle GSAP glowing outline (pulse effect) around the drafting card to indicate active background processing, keeping the user engaged and reducing perceived wait time.

---

## 📌 2. Global Navigation & Layout
**File Location:** `src/components/layout/navbar.tsx` & `src/components/layout/sidebar.tsx`
**Proposed Animation:**
- **Sidebar Staggered Links:** When opening the sidebar on mobile, use Framer Motion's `staggerChildren` to slide in the navigation links one by one.
- **Active Link Indicator:** Animate a subtle background highlight behind the currently active route using `layoutId` (Framer Motion's shared layout animation).

---

## 📌 3. Invoice Dashboard (Empty States & Lists)
**File Location:** `src/app/(dashboard)/invoices/page.tsx` & `src/components/invoices/`
**Proposed Animation:**
- **Empty State Floating Graphic:** Use GSAP to animate an SVG (e.g., an empty folder or ghost icon) with a continuous floating/breathing `y-axis` animation.
- **Invoice List Entry:** When the list of invoices fetches from Supabase, the rows should slide up into view (`opacity: 0, y: 20` to `opacity: 1, y: 0`) rather than snapping in instantly.

---

## 📌 4. Interactive Action Buttons
**File Location:** `src/components/ui/button.tsx`
**Proposed Animation:**
- **Tap & Hover:** Add `whileHover={{ scale: 1.02 }}` and `whileTap={{ scale: 0.95 }}` globally to primary action buttons.
- **Success State Checkmark:** On critical actions (like "Send Email" or "Save Settings"), transition the button into a green circle where an SVG path checkmark draws itself (`pathLength` animation in Framer Motion).

---

## 📌 5. Modals & Dialogs
**File Location:** `src/components/ui/dialog.tsx`
**Proposed Animation:**
- **Backdrop Blur Transition:** The background overlay should smoothly fade in and blur.
- **Modal Pop:** The actual dialog box should scale up from `0.9` to `1` with a slight spring bounce effect.

---

### 🛡️ Safety & Security Notes
- All animations will be strictly frontend (`use client`).
- No modifications will be made to Server Components (`page.tsx` data fetchers) or Supabase RLS policies.
- **Zero code changes have been made during this audit.**

**Next Steps:** Review this file and approve. Once approved, we will begin implementing these incrementally using Framer Motion and GSAP.
