# Solved Bugs

## Bug: Sheet component closes on backdrop click and throws TS compilation error on invalid property

### Description
During the transition of the reminder dialog to a right-side drawer/Sheet UI, using the `dismissible={false}` prop on `SheetContent` caused a TypeScript compilation error because the prop is not defined in the `SheetContentProps` interface. Additionally, clicking outside the sheet (backdrop clicks) closed the drawer, which risked losing un-sent email drafts.

### Root Cause
1. `@base-ui/react`'s custom `Dialog.Popup` component wrapper (`SheetContent`) does not expose a `dismissible` property.
2. The default behavior of Base UI dialogs is to dismiss the dialog on pointer interactions outside the container.

### Solution
1. Removed `dismissible={false}` from `<SheetContent>`.
2. Passed `disablePointerDismissal={true}` on `<Sheet>` (which wraps `SheetPrimitive.Root`), which tells Base UI to disable closing the drawer via outside backdrop clicks.
3. Verified the codebase compiles successfully via `npx tsc --noEmit` and all unit tests pass.

---

## Bug: Gmail Direct Send Email text collapses into a single paragraph without spacing/newbreaks

### Description
In direct sending from the Reminder Drawer, all spacing, linebreaks, and paragraphs in the draft got collapsed into a single block of text when received in Gmail.

### Root Cause
The `sendGmailReminder` client uses `Content-Type: text/html`. Since the raw text of the generated reminder was passed directly as HTML body without converting newlines to HTML tags, the rendering engines collapsed all newlines (`\n` or `\r\n`) and spaces into a single block of text.

### Solution
1. Implemented a `formatPlainTextToEmailHtml` helper in `src/lib/reminders/actions.ts`.
2. This helper breaks paragraphs by double newlines (`\n\n`) and wraps them in `<p>` tags with professional CSS styling (modern font stacks, spacing margins, line heights, and typography colors).
3. It also replaces single newlines with `<br />` and auto-detects/links URLs with a styled, professional green `<a>` tag for invoice links.
4. Integrated this formatter into `sendDirectGmailReminderAction` before the mail is sent.
5. Successfully compiled and verified test suites.
