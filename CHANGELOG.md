# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.2.0] - 2026-06-17

### Changed
- **SheetJS-powered Export:** Replaced all manual CSV/XML export code (~120 lines) with the battle-tested `xlsx` (SheetJS) library. Excel exports now produce real `.xlsx` files (not legacy XML-based `.xls`), with correct Unicode support, automatic column width handling, and proper numeric cell typing. All manual `escapeXml`, `escapeCsvValue`, `safeDate`, and `triggerDownload` helpers removed.
- **Added `Amount Paid`, `Paid Date`, and `Notes` columns** to Invoice exports (both CSV and Excel).
- **Button label updated** from "Export Excel" to "Export Excel (.xlsx)" to reflect the modern format.

## [2.1.9] - 2026-06-17

### Fixed
- **CSV & Excel Export Encoding & Characters Handling:** Prepend UTF-8 BOM (`\uFEFF`) to CSV exports to ensure Microsoft Excel displays non-ASCII characters (e.g. international names/currencies) correctly. Implemented `escapeXml` utility to properly escape XML special characters (e.g. `&`, `<`) in Excel Spreadsheet XML templates, preventing file corruption when exporting data containing special characters.

## [2.1.8] - 2026-06-17

### Added
- **CSV & Excel Data Export:** Added Export to CSV and Export to Excel buttons on Invoices and Clients pages. Exporting is processed directly on the client side using compliant formats.
- **API Rate Limiting:** Enforced local-memory based rate limiting for client and invoice creation Server Actions.

### Fixed
- **Invoice Sequence Optimization:** Refactored `getNextInvoiceNumberAction` to fetch a small window of 25 invoices with numeric validation instead of downloading all invoices, optimizing sequence generation performance.

### Removed
- **Dead Code:** Completely removed `UnbilledScratchpad` component and associated unbilled task schema/server actions from the application to simplify the codebase.

## [2.1.7] - 2026-06-17

### Fixed
- **TypeScript Build Safety:** Removed `ignoreBuildErrors: true` from `next.config.ts`. TypeScript errors are now enforced during production builds, preventing runtime type crashes.
- **SSRF Validation Bug:** Fixed `saveAISettingsAction` where `isSafeUrl()` (an async function) was called without `await`, causing the URL safety check to always pass.
- **E2E Bypass Security Hardening:** Removed hardcoded fallback value from E2E bypass secret. The bypass is now completely disabled when the `E2E_BYPASS_SECRET` environment variable is not set.
- **Duplicate Error Logging:** Removed duplicate `console.error` for reminder count update failures in `reminders/actions.ts`.

### Removed
- **Dead Code:** Removed unused `ACTIVE_STATUSES` constant from `dashboard/actions.ts`.

### Changed
- **Silent Error Handling:** Replaced empty `catch (e) {}` blocks in `createInvoiceAction` and `updateInvoiceAction` with proper error returns for malformed line items JSON.

## [2.1.6] - 2026-06-17

### Added
- **Custom Page SEO Metadata:** Configured custom, descriptive page titles and meta descriptions for all pages across authentication, dashboard, invoices, clients, reminders, settings, and trash sections, improving browser-tab UX and search engine indexing.

## [2.1.5] - 2026-06-17

### Added
- **Interactive SVG Astronaut:** Replaced Spline 3D animations with a premium, custom-designed SVG Astronaut empty state character.
- **anime.js Cursor-Following Interactions:** Integrated `anime.js` (modular v4) to power idle floating/blinking animations and smooth, parallax cursor-tracking effects.

### Removed
- **Spline Library & Configurations:** Uninstalled `@splinetool/react-spline` and reverted the CSP `connect-src` configuration to exclude `https://unpkg.com`.

## [2.1.4] - 2026-06-17

### Added
- **Interactive SVG Astronaut:** Replaced Spline 3D animations with a premium, custom-designed SVG Astronaut empty state character.
- **anime.js Cursor-Following Interactions:** Integrated `anime.js` (modular v4) to power idle floating/blinking animations and smooth, parallax cursor-tracking effects.

### Removed
- **Spline Library & Configurations:** Uninstalled `@splinetool/react-spline` and reverted the CSP `connect-src` configuration to exclude `https://unpkg.com`.

## [2.1.3] - 2026-06-17

### Fixed
- **Spline WebAssembly CSP Exception:** Added `https://unpkg.com` to the CSP `connect-src` header in `next.config.ts` to allow loading Spline's runtime WebAssembly binaries, resolving dashboard rendering crashes.

### Changed
- **Code Humanization:** Cleaned up all developer-style explaining comments in `AIHelperCharacter.tsx` to align strictly with `humanize-code` rules.

## [2.1.2] - 2026-06-17

### Added
- **Glassmorphic Empty State SVGs:** Replaced basic character placeholders with custom, glowing inline SVGs for empty states across the Dashboard (Who to Chase Today, Recent Invoices, Recent Reminder Activity), Invoices page, Clients page, and Activity Timeline.

### Fixed
- **TypeScript Warning in Reminder Modal:** Added a type-cast to `provider.key` in the `buildEmailUrl` parameter call to resolve a type mismatch warning.

## [2.1.1] - 2026-06-10

### Changed
- **Codebase Humanization:** Conducted a comprehensive review and refactoring of the codebase to transform machine-generated styling and patterns into professional, clean, senior-engineer-grade code.
- **Type Safety Hardening:** Eliminated all occurrences of `any` across the codebase, substituting them with strict TypeScript interfaces, generic types, or safe narrowing via `unknown` type guards.
- **Centralized Error Handling:** Integrated `logError` and standard UI toast warnings to handle system failures uniformly, propagating detailed logs server-side and displaying generic, friendly actions to client users.
- **Directory Layout Cleanup:** Co-located test specifications, moved loose utility scripts from the repository root to `scripts/debug/`, and deleted outdated, empty type placeholder files.

### Fixed
- **Invoice Builder Compilation:** Resolved multiple typescript errors in `smart-builder-client.tsx` and `page.tsx` involving null-safety for user profiles, select value compatibility, and PDF preview interface mapping.
- **Client Detail Action Props:** Standardized the `Client` data model parameters to eliminate key mismatch warnings inside clients list and client detail sections.
- **PDF Image Element Property:** Fixed react-pdf validation by removing the unsupported `alt` prop from `<Image>` elements.
- **Duplicate Reminders Interface:** Resolved type conflicts caused by local redeclarations of `ReminderHistoryEvent` inside the reminders action layer.
- **Dynamic ES Module Dynamic Import:** Corrected type-level dynamic resolutions for CommonJS-based dependencies (`pdf-parse`) under ESM declarations.
- **Base-UI Trigger Children Types:** Configured child-casting constraints to conform with Base-UI's strict `asChild` element trigger render specifications.

## [2.0.9] - 2026-06-05

### Added
- **Landing Page Redesign:** Redesigned ChaseFree AI's landing page to focus on direct conversion optimization, incorporating key sections for freelance pain points, stats, 3-step invoicing walkthrough, and clear SaaS monetization plans.
- **Roadmap Section:** Introduced a roadmap timeline highlighting future updates, including automated payment sync and client feedback analysis.

## [2.0.8] - 2026-06-04

### Added
- **Mobile Navigation:** Added a sleek, slide-out hamburger menu for mobile users on both the landing page and dashboard.

### Fixed
- **Mobile Zooming:** Added `maximum-scale=1` and `user-scalable=0` metadata to prevent annoying zoom-in on inputs in mobile Safari/Chrome.
- **Hydration Errors:** Fixed console hydration errors caused by nested `<button>` elements inside `<SheetTrigger>` by adopting Base UI's `render` prop pattern.
- **Lint Warnings:** Cleaned up several ESLint accessibility warnings and fixed a missing `alt` prop on an Image inside the PDF generation logic.
- **Responsive Stacking:** Prevented data cards and recent invoice tables from overflowing horizontally on small screens.

## [2.0.7] - 2026-06-04

### Fixed
- **Bot Protection Visibility:** Fixed an issue where the Cloudflare Turnstile widget was completely hidden due to Content Security Policy (CSP) blocking the script. Allowed `challenges.cloudflare.com` in `script-src` and `frame-src`.

## [2.0.6] - 2026-06-04

### Fixed
- **Google OAuth Redirect:** Fixed an issue where logging in with Google in a Vercel preview/production environment incorrectly redirected users back to `http://localhost:3000`. The system now correctly extracts Vercel's dynamic deployment URLs for the OAuth callback.
- **Turnstile Visibility:** Forced the Cloudflare Turnstile bot protection widget to always be visually rendered (`appearance: 'always'`) on all authentication forms, as per design requirements.

## [2.0.5] - 2026-06-04

### Fixed
- **E2E Testing Flakiness:** Resolved a race condition where Cloudflare Turnstile's non-interactive challenge sometimes failed to bypass in GitHub Actions due to the secret key and token validation order.

## [2.0.4] - 2026-05-30

### Fixed
- **Status Badge Light Mode Legibility:** Resolved poor contrast on the "Sent" status badge (and all other status badges like "Due Soon", "Overdue", "Promised", etc.) across the entire application under Light Mode. Statuses now render with high-contrast, premium light-mode tailored backgrounds and borders by default (e.g. `bg-blue-50 text-blue-700 border-blue-200`) and seamlessly transition to midnight dark versions using `dark:` utility prefixes.

## [2.0.3] - 2026-05-29

### Added
- **Dynamic Theme Support:** Added full Light/Dark/System theme options across all dashboard, authentication, and core application pages.
- **Theme Segments Toggle:** Integrated an elegant 3-button segmented theme toggle directly in the user navigation avatar dropdown.
- **Theme E2E Screenshot Testing:** Created a custom Playwright test suite to dynamically verify light/dark mode visual contrast by capturing full-page screenshots.

### Fixed
- **Dashboard Visual Customizer Overrides:** Fixed a major styling conflict where the Visual Customizer's default Midnight Dark preset overrode body and card backgrounds in light mode, forcing a dark black background. The presets now dynamically adapt to light/dark themes, utilizing a pure white layout for light mode.

## [2.0.2] - 2026-05-28

### Added
- **Authentication:** Fully setup Google OAuth authentication with Supabase integration.
- **E2E Tests:** Created end-to-end testing suites for Invoice Lifecycle and Trash/Recovery workflows using Playwright.

### Fixed
- **UI Tweaks:** Fixed UI issues reported via feedback, including Select dropdown overlapping and hover state contrast, Invoice Cancel button visibility, Settings Email field disabled background, Settings Tabs hover contrast, and Settings Upload Document button contrast.

## [2.0.1] - 2026-05-28

### Added
- **Testing Ecosystem:** Introduced Vitest and React Testing Library for fast Unit and Component testing.
- **CI/CD Pipeline:** Added GitHub Actions workflow (`.github/workflows/test-ecosystem.yml`) to automatically run Vitest and Playwright tests on push and pull requests.
- **Security Check:** Added a new Database constraint to strictly validate ISO currency codes on Invoices.

### Changed
- **Test Restructuring:** Organized test files into `unit`, `component`, `integration`, and `e2e` directories to follow the Testing Pyramid.
- **Security Posture:** Hardened the `/api/cron/reminders` endpoint to return `401 Unauthorized` instead of `500 Server Error` when authentication fails or `CRON_SECRET` is missing.
- **Environment Handling:** Updated Vercel configuration instructions and CI pipelines to require `CRON_SECRET`.

### Removed
- **Security Risk:** Deleted test files (`test-api.mjs`, `test-fetch.mjs`, `test-fetch-openai.mjs`) that accidentally contained hardcoded raw API keys.
