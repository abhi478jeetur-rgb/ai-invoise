# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
